import * as v from "valibot";

const GoogleExchangeResponseSchema = v.required(
	v.object({
		email: v.pipe(v.string(), v.email(), v.nonEmpty()),
		profilePicture: v.pipe(v.string(), v.url(), v.nonEmpty()),
		username: v.pipe(v.string(), v.nonEmpty()),

		accessToken: v.pipe(v.string(), v.nonEmpty()),
		refreshToken: v.pipe(v.string(), v.nonEmpty()),
		expiryTimestamp: v.number(),
		tokenType: v.pipe(v.string(), v.nonEmpty()),
	}),
);

type GoogleExchangeResponse = v.InferOutput<
	typeof GoogleExchangeResponseSchema
>;

export { GoogleExchangeResponseSchema, type GoogleExchangeResponse };
