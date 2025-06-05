import {
	genericRegisterAsyncHandler,
	type NodeHandlerFunction,
	registerIntegrationNodeHandlerRegistrar,
} from "../../../node-executor-utils";
import * as v from "valibot";
import { GoogleFormsProjectIntegrationSchema } from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsProjectIntegrationSchema";
import {
	createGoogleFormsBaseNode,
	type GoogleFormsFile,
} from "@impoexpo/shared/nodes/integrations/google/google-forms";
import { extractGoogleAuth } from "../../../../integrations/google/common/middlewares";
import { getGoogleClient } from "../../../../integrations/google/common/helpers";
import { type forms_v1, google } from "googleapis";
import { registerBaseNodes } from "@impoexpo/shared/nodes/node-database";
import { GOOGLE_FORMS_INTEGRATION_ID } from "@impoexpo/shared/schemas/integrations/google/forms/static";
import {
	GoogleFormsChoiceQuestionType,
	GoogleFormsQuestionType,
} from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsLayoutSchema";
import { DateTime } from "luxon";

type NonNullableFields<T> = {
	[P in keyof T]: NonNullable<T[P]>;
};

registerIntegrationNodeHandlerRegistrar(
	GOOGLE_FORMS_INTEGRATION_ID,
	(project) => {
		const integration = project.integrations[GOOGLE_FORMS_INTEGRATION_ID];
		if (!integration || !v.is(GoogleFormsProjectIntegrationSchema, integration))
			throw new Error();

		const handlers: Record<
			string,
			NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
		> = {};

		for (const [id, layout] of Object.entries(integration.data.forms)) {
			const base = createGoogleFormsBaseNode(id, layout);
			registerBaseNodes(base);

			genericRegisterAsyncHandler(handlers, base, async (ctx) => {
				const auth = extractGoogleAuth(integration.auth.tokens);
				const client = getGoogleClient();
				client.setCredentials({
					access_token: auth.accessToken,
					refresh_token: auth.refreshToken,
					expiry_date: auth.expiryTimestamp,
				});

				const formsClient = google.forms({
					version: "v1",
					auth: client,
				});

				const response = await formsClient.forms.responses.list({
					formId: id,
				});
				if (response.status !== 200) {
					throw new Error(`failed to fetch responses for form with id ${id}`);
				}

				const responses = (response.data.responses ?? []).map((response) => {
					if (!response.answers) {
						throw new Error(
							`failed to query responses: response with id ${response.responseId} did not provide any answers`,
						);
					}
					const outputs: Record<string, unknown> = {};
					for (const item of integration.data.forms[id].items) {
						const answer = Object.entries(response.answers).find(
							([k]) => k === item.id,
						)?.[1];
						const question = integration.data.forms[id].items.find(
							(i) => i.id === item.id,
						);

						if (answer && question) {
							const textAnswers = answer.textAnswers?.answers;
							const fileUploadAnswers = answer.fileUploadAnswers?.answers;

							switch (question.questionMetadata.type) {
								case GoogleFormsQuestionType.CHOICE:
									if (!textAnswers) continue;
									switch (question.questionMetadata.choiceType) {
										case GoogleFormsChoiceQuestionType.CHECKBOX:
											outputs[item.id] = textAnswers.map(
												(ans) => ans.value ?? "",
											);
											break;
										case GoogleFormsChoiceQuestionType.RADIO:
										case GoogleFormsChoiceQuestionType.DROP_DOWN:
											outputs[item.id] = textAnswers[0].value ?? "";
											break;
									}
									break;
								case GoogleFormsQuestionType.DATE:
									if (!textAnswers) continue;
									// i have no idea why google forms stores it's dates and times in SQL format
									// despite having stuff like firebase
									outputs[item.id] = DateTime.fromSQL(
										textAnswers[0].value ?? "",
									);
									break;
								case GoogleFormsQuestionType.FILE_UPLOAD:
									if (!fileUploadAnswers) continue;
									outputs[item.id] = fileUploadAnswers
										.filter(
											(
												ans,
											): ans is NonNullableFields<
												Required<forms_v1.Schema$FileUploadAnswer>
											> => !!ans.fileId && !!ans.fileName && !!ans.mimeType,
										)
										.map(
											(ans) =>
												({
													owner: id,
													id: ans.fileId,
													name: ans.fileName,
													type: ans.mimeType,
													link: `https://drive.google.com/file/d/${ans.fileId}/view`,
												}) satisfies GoogleFormsFile,
										);
									break;
								case GoogleFormsQuestionType.RATING:
								case GoogleFormsQuestionType.SCALE:
									if (!textAnswers) continue;
									outputs[item.id] = Number.parseInt(
										textAnswers[0].value ?? "",
									);
									break;
								case GoogleFormsQuestionType.TEXT:
									if (!textAnswers) continue;
									outputs[item.id] = textAnswers[0].value ?? "";
									break;
								case GoogleFormsQuestionType.TIME:
									if (!textAnswers) continue;
									outputs[item.id] = DateTime.fromSQL(
										textAnswers[0].value ?? "",
									);
									break;
							}
						} else {
							outputs[item.id] = null;
						}
					}

					return outputs;
				});

				return responses;
			});
		}
		return handlers;
	},
);
