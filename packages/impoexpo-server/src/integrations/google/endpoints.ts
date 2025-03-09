import type { Express } from "express";
import { query, validationResult } from "express-validator";
import { childLogger, logger } from "../../logger";
import { google } from "googleapis";

export const registerGoogleEndpoints = (app: Express) => {
	if (
		!process.env.GOOGLE_CLIENT_ID ||
		!process.env.GOOGLE_CLIENT_SECRET ||
		!process.env.GOOGLE_CLIENT_REDIRECT_URL
	) {
		throw new Error(
			"cannot register google endpoints without GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CLIENT_REDIRECT_URL in the .env file",
		);
	}

	app.post(
		"/integration/google/exchange",
		query("code").notEmpty(),
		async (req, res) => {
			const result = validationResult(req);
			if (!result.isEmpty()) {
				res.status(401).send({ errors: result.array() });
				return;
			}

			try {
				const client = new google.auth.OAuth2({
					clientId: process.env.GOOGLE_CLIENT_ID,
					clientSecret: process.env.GOOGLE_CLIENT_SECRET,
					redirectUri: process.env.GOOGLE_CLIENT_REDIRECT_URL,
				});

				const { tokens } = await client.getToken(req.query?.code);

				// TODO: get the user's email and profile picture, store the tokens & send stuff back
			} catch (err) {
				res
					.status(500)
					.send(`failed to receive tokens from the provided code: ${err}`);
				childLogger("integration/google").error(err);
			}
		},
	);

	logger.info("   -> successfully registered google endpoints");
};
