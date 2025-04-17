import type { NextFunction, Request, Response } from "express";
import { header } from "express-validator";
import { getGoogleClient } from "./helpers";
import type { FaultyAction } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import { GOOGLE_ACCESS_TOKENS_HEADER_NAME } from "@impoexpo/shared/schemas/integrations/google/static";
import { GoogleAccessTokensSchema } from "@impoexpo/shared/schemas/integrations/google/GoogleExchangeResponseSchema";
import { decryptString } from "../../helpers/crypto-utils";
import * as v from "valibot";

export const requireGoogleAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	for (const validation of [
		header(
			GOOGLE_ACCESS_TOKENS_HEADER_NAME,
			"missing google access tokens header",
		).notEmpty(),
	]) {
		const result = await validation.run(req);
		if (!result.isEmpty()) {
			res.status(400).send({
				ok: false,
				internal: false,
				error: result.array({ onlyFirstError: true })[0].msg,
			} satisfies FaultyAction);
			return;
		}
	}

	next();
};

export const extractGoogleAuth = (req: Request): GoogleAccessTokensSchema => {
	const encryptedString = req.get(GOOGLE_ACCESS_TOKENS_HEADER_NAME) as string;
	const decrypted = JSON.parse(
		decryptString(encryptedString, "base64", "utf8"),
	);
	if (!v.is(GoogleAccessTokensSchema, decrypted)) {
		throw new Error(
			"the decrypted access tokens header does not satisfy the GoogleAccessTokensSchema",
		);
	}
	return decrypted;
};

export const getAuthenticatedGoogleClient = (req: Request) => {
	const auth = extractGoogleAuth(req);
	const client = getGoogleClient();
	client.setCredentials({
		access_token: auth.accessToken,
		refresh_token: auth.refreshToken,
		expiry_date: auth.expiryTimestamp,
	});
	return client;
};
