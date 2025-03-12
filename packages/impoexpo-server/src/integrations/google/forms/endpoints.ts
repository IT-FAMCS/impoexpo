import type { Express } from "express";
import { header, query, validationResult } from "express-validator";
import { childLogger, logger } from "../../../logger";
import { google } from "googleapis";
import { ListGoogleFormsResponse } from "@impoexpo/shared";
import { getByAccessToken } from "../db";

export const registerGoogleFormsEndpoints = (app: Express) => {
	logger.info("       -> registering google forms endpoints");

	app.get(
		"/integration/google/forms/list",
		header("Authorization", "missing authorization header"),
		async (req, res) => {
			const result = validationResult(req);
			if (!result.isEmpty()) {
				res.status(401).send({ errors: result.array() });
				return;
			}

			// biome-ignore lint/style/noNonNullAssertion: validated by express-validator
			const token = req.headers.authorization!;
			getByAccessToken(token);

			/* const client = new google.auth.OAuth2({
			});

			const formClient = google.forms('v1');
			const driveClient = google.drive('v3');

			const files = await driveClient.files.list({
				q: "mimeType='application/vnd.google-apps.form'",
				access_token: token
			});
			console.log(files); */

			res.send([]);

			//const forms = await client.forms.get();
			//const response: ListGoogleFormsResponse = [];

			//for(const form of forms.data)
		},
	);
};
