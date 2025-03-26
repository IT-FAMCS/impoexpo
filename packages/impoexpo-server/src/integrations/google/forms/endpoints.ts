import type { Express, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { childLogger, logger } from "../../../logger";
import { google } from "googleapis";

import type { FaultyAction } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import {
	GOOGLE_FORMS_LIST_ROUTE,
	GOOGLE_FORMS_VERIFY_ROUTE,
} from "@impoexpo/shared/schemas/integrations/google/forms/endpoints";
import type { ListGoogleForm } from "@impoexpo/shared/schemas/integrations/google/forms/ListGoogleFormsResponseSchema";

import {
	getAuthenticatedGoogleClient,
	requireGoogleAuth,
} from "../middlewares";
import {
	defaultCache,
	cacheOnlyIfSuccessful,
	defaultRatelimiter,
} from "../../../common";

export const registerGoogleFormsEndpoints = (app: Express) => {
	logger.info("       -> registering google forms endpoints");

	app.get(
		GOOGLE_FORMS_VERIFY_ROUTE,
		requireGoogleAuth,
		query("id").notEmpty(),
		defaultRatelimiter("1 minute", 10, { skipFailedRequests: false }),
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
				const client = getAuthenticatedGoogleClient(req);
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

				res.send({ ok: true, internal: false } satisfies FaultyAction);
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
				const client = getAuthenticatedGoogleClient(req);
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
};
