import type { Express, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { childLogger, logger } from "../../logger";
import { google } from "googleapis";

import type {
	FaultyAction,
	FaultyActionInput,
} from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import {
	GOOGLE_FORMS_INTEGRATION_ID,
	GOOGLE_FORMS_LAYOUT_ROUTE,
	GOOGLE_FORMS_LIST_ROUTE,
	GOOGLE_FORMS_VERIFY_ROUTE,
} from "@impoexpo/shared/schemas/integrations/google/forms/static";
import type { ListGoogleForm } from "@impoexpo/shared/schemas/integrations/google/forms/ListGoogleFormsResponseSchema";
import {
	GoogleFormsChoiceQuestionType,
	GoogleFormsQuestionType,
	type GoogleFormsLayout,
	type GoogleFormsLayoutItem,
} from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsLayoutSchema";

import {
	getAuthenticatedGoogleClient,
	requireGoogleAuth,
} from "./common/middlewares";
import {
	defaultCache,
	cacheOnlyIfSuccessful,
	defaultRatelimiter,
} from "../../common";
import { registerIntegration } from "../../registry";

registerIntegration({
	id: GOOGLE_FORMS_INTEGRATION_ID,
	dependencies: ["google-shared"],
	async registerEndpoints(app) {
		const logger = childLogger("integrations/google/forms");
		logger.info("registering google forms endpoints");
		app.get(
			GOOGLE_FORMS_LAYOUT_ROUTE,
			requireGoogleAuth,
			query("id").notEmpty(),
			defaultRatelimiter("1 hour", 15),
			async (req: Request, res: Response) => {
				const result = validationResult(req);
				if (!result.isEmpty()) {
					res.status(400).send({
						ok: false,
						internal: false,
						error: result.array({ onlyFirstError: true })[0].msg,
					} satisfies FaultyAction);
					return;
				}

				try {
					const client = await getAuthenticatedGoogleClient(req);
					const formsClient = google.forms({
						version: "v1",
						auth: client,
					});

					const response = await formsClient.forms.get({
						formId: req.query?.id as string,
					});

					if (response.status !== 200) {
						res.status(502).send({
							ok: false,
							internal: false,
							error: `google api returned an unsuccessful http code (${response.status}): ${response.statusText}`,
						} satisfies FaultyAction);
					}

					const layout: GoogleFormsLayout = {
						title:
							response.data.info?.title ??
							response.data.info?.documentTitle ??
							"",
						description: response.data.info?.description ?? null,
						items: [],
					};
					for (const rawItem of response.data.items ?? []) {
						if (!rawItem.questionItem?.question) continue;
						const question = rawItem.questionItem.question;

						const item: Partial<GoogleFormsLayoutItem> = {
							id: rawItem.questionItem.question.questionId ?? "",
							title: rawItem.title ?? null,
							description: rawItem.description ?? null,
							required: rawItem.questionItem.question.required ?? false,
						};

						if (question.choiceQuestion?.type) {
							item.questionMetadata = {
								type: GoogleFormsQuestionType.CHOICE,
								choiceType:
									GoogleFormsChoiceQuestionType[
										question.choiceQuestion
											.type as keyof typeof GoogleFormsChoiceQuestionType
									],
							};
							item.type =
								item.questionMetadata.choiceType ===
								GoogleFormsChoiceQuestionType.CHECKBOX
									? "Array<string>"
									: "string";
						}

						if (question.dateQuestion) {
							item.questionMetadata = {
								type: GoogleFormsQuestionType.DATE,
								includeTime: question.dateQuestion.includeTime ?? false,
								includeYear: question.dateQuestion.includeYear ?? false,
							};
							item.type = "DateTime";
						}

						if (question.fileUploadQuestion?.maxFiles) {
							item.questionMetadata = {
								type: GoogleFormsQuestionType.FILE_UPLOAD,
								allowMultiple: question.fileUploadQuestion.maxFiles > 1,
							};
							item.type = "Array<GoogleFormsFile>";
						}

						if (question.ratingQuestion) {
							item.questionMetadata = { type: GoogleFormsQuestionType.RATING };
							item.type = "number";
						}

						if (question.scaleQuestion) {
							item.questionMetadata = { type: GoogleFormsQuestionType.SCALE };
							item.type = "number";
						}

						if (question.textQuestion) {
							item.questionMetadata = { type: GoogleFormsQuestionType.TEXT };
							item.type = "string";
						}

						if (question.timeQuestion) {
							item.questionMetadata = { type: GoogleFormsQuestionType.TIME };
							item.type = "DateTime";
						}

						if (!question.required) item.type += " | null";
						layout.items.push(item as GoogleFormsLayoutItem);
					}

					res.send(layout);
				} catch (err) {
					res.status(500).send({
						ok: false,
						internal: true,
						error: `${err}`,
					} satisfies FaultyAction);
					childLogger("integration/google/forms").error(err);
				}
			},
		);

		app.get(
			GOOGLE_FORMS_VERIFY_ROUTE,
			requireGoogleAuth,
			query("id").notEmpty(),
			defaultRatelimiter("1 hour", 15, { skipFailedRequests: false }),
			async (req: Request, res: Response) => {
				const result = validationResult(req);
				if (!result.isEmpty()) {
					res.status(400).send({
						ok: false,
						internal: false,
						error: result.array({ onlyFirstError: true })[0].msg,
					} satisfies FaultyAction);
					return;
				}

				try {
					const client = await getAuthenticatedGoogleClient(req);
					const formsClient = google.forms({
						version: "v1",
						auth: client,
					});

					const response = await formsClient.forms.responses.list({
						pageSize: 1,
						formId: req.query?.id as string,
					});
					if (response.status !== 200) {
						res.status(502).send({
							ok: false,
							internal: false,
							error: `google api returned an unsuccessful http code (${response.status}): ${response.statusText}`,
						} satisfies FaultyAction);
					}

					res.send({ ok: true } satisfies FaultyActionInput);
				} catch (err) {
					res.status(500).send({
						ok: false,
						internal: true,
						error: `${err}`,
					} satisfies FaultyAction);
					childLogger("integration/google/forms").error(err);
				}
			},
		);

		app.get(
			GOOGLE_FORMS_LIST_ROUTE,
			requireGoogleAuth,
			defaultRatelimiter("1 hour", 10),
			defaultCache("1 day", cacheOnlyIfSuccessful),
			async (req: Request, res: Response) => {
				try {
					const client = await getAuthenticatedGoogleClient(req);
					const driveClient = google.drive({
						version: "v3",
						auth: client,
					});

					const filesResponse = await driveClient.files.list({
						q: "mimeType='application/vnd.google-apps.form'",
					});
					if (
						filesResponse.status !== 200 ||
						filesResponse.data.files === undefined
					) {
						throw new Error(
							`google drive API returned invalid data (status code ${filesResponse.status})`,
						);
					}

					const response = filesResponse.data.files?.map((file) => {
						if (!file.id)
							throw new Error(
								"google drive API response contained no ID for one of the files",
							);
						if (!file.name)
							throw new Error(
								"google drive API response contained no filename for one of the files",
							);

						return {
							id: file.id,
							name: file.name,
							description: file.description ?? undefined,
						} satisfies ListGoogleForm;
					});

					res.send(response);
				} catch (err) {
					res.status(500).send({
						ok: false,
						internal: true,
						error: `failed to list forms: ${err}`,
					} satisfies FaultyAction);
					childLogger("integration/google/forms").error(err);
				}
			},
		);
	},
});
