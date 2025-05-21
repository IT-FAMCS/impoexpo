import type { Express } from "express";
import { query, validationResult } from "express-validator";
import { childLogger, logger } from "../../logger";
import { google } from "googleapis";
import {
	getGoogleClient,
	googleEnvironmentVariablesPresent,
} from "./common/helpers";

import type {
	GoogleAccessTokensSchema,
	GoogleExchangeResponse,
} from "@impoexpo/shared/schemas/integrations/google/GoogleExchangeResponseSchema";
import type { GoogleRefreshResponse } from "@impoexpo/shared/schemas/integrations/google/GoogleRefreshResponseSchema";
import {
	GOOGLE_EXCHANGE_ROUTE,
	GOOGLE_REFRESH_ROUTE,
} from "@impoexpo/shared/schemas/integrations/google/static";
import type { FaultyAction } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import { encryptObject } from "../../helpers/crypto-utils";
import {
	getAuthenticatedGoogleClient,
	requireGoogleAuth,
} from "./common/middlewares";
import { defaultRatelimiter } from "../../common";
import { registerIntegration } from "../../registry";

registerIntegration({
	id: "google-shared",
	async init() {
		if (!googleEnvironmentVariablesPresent())
			return {
				success: false,
				message:
					"google environment variables were not found (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CLIENT_REDIRECT_URL)",
				help: "check the documentation (TODO)",
			};
		return { success: true };
	},
	async registerEndpoints(app) {
		app.get(
			GOOGLE_REFRESH_ROUTE,
			requireGoogleAuth,
			defaultRatelimiter("10 seconds", 1),
			async (req, res) => {
				try {
					const client = await getAuthenticatedGoogleClient(req);
					const newToken = await client.getAccessToken();
					if (!newToken.token) {
						res.status(502).send({
							ok: false,
							internal: false,
							error: `google api failed to return a new access token (HTTP/${newToken.res?.status})`,
						} satisfies FaultyAction);
						return;
					}

					client.credentials.access_token = newToken.token;
					const encryptedTokens = encryptObject(
						{
							// biome-ignore lint/style/noNonNullAssertion: request would've failed if it wasn't set
							accessToken: client.credentials.access_token!,
							// biome-ignore lint/style/noNonNullAssertion: request would've failed if it wasn't set
							refreshToken: client.credentials.refresh_token!,
							// biome-ignore lint/style/noNonNullAssertion: request would've failed if it wasn't set
							tokenType: client.credentials.token_type!,
							// biome-ignore lint/style/noNonNullAssertion: request would've failed if it wasn't set
							expiryTimestamp: client.credentials.expiry_date!,
						} satisfies GoogleAccessTokensSchema,
						"base64",
					);

					res.send({ tokens: encryptedTokens } satisfies GoogleRefreshResponse);
				} catch (err) {
					res.status(500).send({
						ok: false,
						internal: true,
						error: `failed to refresh an access token: ${err}`,
					} satisfies FaultyAction);
					childLogger("integration/google").error(err);
				}
			},
		);

		app.post(
			GOOGLE_EXCHANGE_ROUTE,
			query("code").notEmpty(),
			defaultRatelimiter("10 seconds", 1),
			async (req, res) => {
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
					const client = getGoogleClient();
					const { tokens } = await client.getToken(req.query?.code as string);
					client.setCredentials(tokens);

					const auth = google.oauth2({
						version: "v2",
						auth: client,
					});
					const info = await auth.userinfo.get();
					if (info.status !== 200) {
						throw new Error(
							"couldn't GET personal information (email, profile picture, etc.)",
						);
					}

					// i swear to god google
					if (!info.data.email)
						throw new Error("received null instead of email");
					if (!info.data.picture)
						throw new Error("received null instead of profile picture URL");
					if (!info.data.name) throw new Error("received null instead of name");
					if (!tokens.access_token)
						throw new Error("received null instead of access_token");
					if (!tokens.expiry_date)
						throw new Error("received null instead of expiry_date");
					if (!tokens.refresh_token)
						throw new Error("received null instead of refresh_token");
					if (!tokens.token_type)
						throw new Error("received null instead of token type");

					const encryptedTokens = encryptObject(
						{
							accessToken: tokens.access_token,
							refreshToken: tokens.refresh_token,
							tokenType: tokens.token_type,
							expiryTimestamp: tokens.expiry_date,
						} satisfies GoogleAccessTokensSchema,
						"base64",
					);

					const response: GoogleExchangeResponse = {
						email: info.data.email,
						profilePicture: info.data.picture,
						username: info.data.name,
						tokens: encryptedTokens,
					};

					res.send(response);
				} catch (err) {
					res.status(500).send({
						ok: false,
						internal: true,
						error: `failed to receive user information from the provided code: ${err}`,
					} satisfies FaultyAction);
					childLogger("integration/google").error(err);
				}
			},
		);
	},
});
