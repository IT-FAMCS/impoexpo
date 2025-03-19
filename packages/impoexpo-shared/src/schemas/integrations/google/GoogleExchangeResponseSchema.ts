import { type } from "arktype";

export const GoogleExchangeResponseSchema = type({
	email: "string.email > 0",
	profilePicture: "string.url > 0",
	username: "string > 0",

	accessToken: "string > 0",
	refreshToken: "string > 0",
	expiryTimestamp: "number",
	tokenType: "string > 0",
});

export type GoogleExchangeResponse = typeof GoogleExchangeResponseSchema.infer;
