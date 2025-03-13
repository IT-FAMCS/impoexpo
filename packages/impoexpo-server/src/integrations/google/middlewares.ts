import type { NextFunction, Request, Response } from "express";
import { header } from "express-validator";
import { getGoogleClient } from "./helpers";
import {
	GOOGLE_ACCESS_TOKEN_HEADER_NAME,
	GOOGLE_EXPIRY_TIMESTAMP_HEADER_NAME,
	GOOGLE_REFRESH_TOKEN_HEADER_NAME,
} from "@impoexpo/shared";

export const googleAuthValidations = [
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
];

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
