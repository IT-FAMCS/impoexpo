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

export const GoogleExchangeResponseSchema = object({
	email: pipe(string(), email(), nonEmpty()),
	profilePicture: pipe(string(), url(), nonEmpty()),
	username: pipe(string(), nonEmpty()),

	accessToken: pipe(string(), nonEmpty()),
	refreshToken: pipe(string(), nonEmpty()),
	tokenType: pipe(string(), nonEmpty()),
	expiryTimestamp: number(),
});

export type GoogleExchangeResponse = InferOutput<
	typeof GoogleExchangeResponseSchema
>;
