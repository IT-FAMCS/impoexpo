import type { Express, Request, Response } from "express";
import { header, query, validationResult } from "express-validator";
import { childLogger, logger } from "../../../logger";
import { google } from "googleapis";
import { ListGoogleFormsResponse } from "@impoexpo/shared";
import {
	extractGoogleAuth,
	getAuthenticatedGoogleClient,
	googleAuthValidations,
} from "../middlewares";

export const registerGoogleFormsEndpoints = (app: Express) => {
	logger.info("       -> registering google forms endpoints");

	app.get(
		"/integration/google/forms/list",
		...googleAuthValidations,
		async (req: Request, res: Response) => {
			const result = validationResult(req);
			if (!result.isEmpty()) {
				res.status(400).send({ errors: result.array() });
				return;
			}

			const client = getAuthenticatedGoogleClient(req);
			const driveClient = google.drive({
				version: "v3",
				auth: client,
			});

			const files = await driveClient.files.list({
				q: "mimeType='application/vnd.google-apps.form'",
			});
			res.send(
				files.data.files?.map((file) => ({
					id: file.id,
					name: file.name,
					description: file.description,
				})) ?? ([] as ListGoogleFormsResponse),
			);
		},
	);
};
