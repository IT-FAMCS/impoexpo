import * as v from "valibot";

const DatabaseGoogleUserSchema = v.required(
	v.object({
		email: v.pipe(v.string(), v.email(), v.nonEmpty()),
		profilePicture: v.pipe(v.string(), v.url(), v.nonEmpty()),
		name: v.pipe(v.string(), v.nonEmpty()),
		accessToken: v.pipe(v.string(), v.nonEmpty()),
		refreshToken: v.pipe(v.string(), v.nonEmpty()),
		tokenType: v.pipe(v.string(), v.nonEmpty()),
		expiryTimestamp: v.number(),
		removalTimestamp: v.number(),
	}),
);

type DatabaseGoogleUser = v.InferOutput<typeof DatabaseGoogleUserSchema>;

export { DatabaseGoogleUserSchema, type DatabaseGoogleUser };
