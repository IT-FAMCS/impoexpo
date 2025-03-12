import type { Express } from "express";
import { query, validationResult } from "express-validator";
import { childLogger, logger } from "../../logger";
import { google } from "googleapis";
import type { GoogleExchangeResponse } from "@impoexpo/shared";
import { registerGoogleFormsEndpoints } from "./forms/endpoints";

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

	logger.info("	-> registering google endpoints");
	registerGoogleFormsEndpoints(app);

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
				client.setCredentials(tokens);

				const auth = await google.oauth2({
					version: "v2",
					auth: client,
				});
				const info = await auth.userinfo.get();
				if (info.status !== 200) {
					throw new Error(
						"failed to GET personal information (email, profile picture, etc.)",
					);
				}

				// i swear to god google
				if (!info.data.email) throw new Error("received null instead of email");
				if (!info.data.picture)
					throw new Error("received null instead of profile picture URL");
				if (!info.data.name) throw new Error("received null instead of name");
				if (!tokens.access_token)
					throw new Error("received null instead of access_token");
				if (!tokens.expiry_date)
					throw new Error("received null instead of token expiry timestamp");
				if (!tokens.token_type) throw new Error("received null instead of ");

				const response: GoogleExchangeResponse = {
					email: info.data.email,
					profilePicture: info.data.picture,
					username: info.data.name,

					accessToken: tokens.access_token,
					expiryTimestamp: tokens.expiry_date,
					tokenType: tokens.token_type,
				};

				res.send(response);
			} catch (err) {
				res
					.status(500)
					.send(
						`failed to receive user information from the provided code: ${err}`,
					);
				childLogger("integration/google").error(err);
			}
		},
	);
};
