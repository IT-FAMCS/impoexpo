import {
	object,
	pipe,
	string,
	nonEmpty,
	email,
	url,
	number,
	type InferOutput,
} from "valibot";

export const GoogleAccessTokensSchema = object({
	accessToken: pipe(string(), nonEmpty()),
	refreshToken: pipe(string(), nonEmpty()),
	tokenType: pipe(string(), nonEmpty()),
	expiryTimestamp: number(),
});

export const GoogleExchangeResponseSchema = object({
	email: pipe(string(), email(), nonEmpty()),
	profilePicture: pipe(string(), url(), nonEmpty()),
	username: pipe(string(), nonEmpty()),
	tokens: pipe(string(), nonEmpty()),
});

export type GoogleExchangeResponse = InferOutput<
	typeof GoogleExchangeResponseSchema
>;

export type GoogleAccessTokensSchema = InferOutput<
	typeof GoogleAccessTokensSchema
>;
