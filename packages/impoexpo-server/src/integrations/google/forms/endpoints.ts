import type { Express, Request, Response } from "express";
import { validationResult } from "express-validator";
import { childLogger, logger } from "../../../logger";
import { google } from "googleapis";
import {
	GOOGLE_FORMS_LIST_ROUTE,
	type ListGoogleFormsResponseInstance,
} from "@impoexpo/shared";
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
					} satisfies ListGoogleFormsResponseInstance;
				});

				res.json(response);
			} catch (err) {
				res.status(500).send(`failed to list forms: ${err}`);
				childLogger("integration/google/forms").error(err);
			}
		},
	);
};
