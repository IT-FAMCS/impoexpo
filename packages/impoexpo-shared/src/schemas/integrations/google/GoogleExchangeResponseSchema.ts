import * as v from "valibot";

const GoogleExchangeResponseSchema = v.required(
	v.object({
		email: v.pipe(v.string(), v.email()),
		profilePicture: v.pipe(v.string(), v.url()),
		username: v.string(),

		accessToken: v.string(),
		expiryTimestamp: v.number(),
		removalTimestamp: v.number(),
		tokenType: v.string(),
	}),
);

type GoogleExchangeResponse = v.InferOutput<
	typeof GoogleExchangeResponseSchema
>;

export { GoogleExchangeResponseSchema, type GoogleExchangeResponse };
