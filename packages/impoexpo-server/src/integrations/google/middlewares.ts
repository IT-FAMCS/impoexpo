import type { NextFunction, Request, RequestHandler, Response } from "express";
import { header } from "express-validator";
import { getGoogleClient } from "./helpers";
import {
	GOOGLE_ACCESS_TOKEN_HEADER_NAME,
	GOOGLE_EXPIRY_TIMESTAMP_HEADER_NAME,
	GOOGLE_REFRESH_TOKEN_HEADER_NAME,
} from "@impoexpo/shared";

export const requireGoogleAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	for (const validation of [
		header(
			GOOGLE_ACCESS_TOKEN_HEADER_NAME,
			"missing google access token header",
		).notEmpty(),
		header(
			GOOGLE_REFRESH_TOKEN_HEADER_NAME,
			"missing google refresh token header",
		).notEmpty(),
		header(
			GOOGLE_EXPIRY_TIMESTAMP_HEADER_NAME,
			"missing google expiry timestamp header",
		).isNumeric(),
	]) {
		const result = await validation.run(req);
		if (!result.isEmpty()) {
			res.status(400).json(result.array({ onlyFirstError: true })[0].msg);
			return;
		}
	}

	next();
};

export const extractGoogleAuth = (
	req: Request,
): {
	access: string;
	refresh: string;
	expiry: number;
} => {
	return {
		access: req.get(GOOGLE_ACCESS_TOKEN_HEADER_NAME) as string,
		refresh: req.get(GOOGLE_REFRESH_TOKEN_HEADER_NAME) as string,
		expiry: Number.parseInt(
			req.get(GOOGLE_EXPIRY_TIMESTAMP_HEADER_NAME) as string,
		),
	};
};

export const getAuthenticatedGoogleClient = (req: Request) => {
	const auth = extractGoogleAuth(req);
	const client = getGoogleClient();
	client.setCredentials({
		access_token: auth.access,
		refresh_token: auth.refresh,
		expiry_date: auth.expiry,
	});
	return client;
};
