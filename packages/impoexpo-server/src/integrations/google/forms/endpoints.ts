import type { Express } from "express";
import { header, query, validationResult } from "express-validator";
import { childLogger, logger } from "../../../logger";
import { google } from "googleapis";
import { ListGoogleFormsResponse } from "@impoexpo/shared";

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

			const formClient = google.forms({
				version: "v1",
				auth: token,
			});

			const driveClient = google.drive({
				version: "v3",
				auth: token,
			});

			const files = await driveClient.files.list({
				q: "mimeType='application/vnd.google-apps.form'",
			});
			console.log(files);

			res.send([]);

			//const forms = await client.forms.get();
			//const response: ListGoogleFormsResponse = [];

			//for(const form of forms.data)
		},
	);
};
