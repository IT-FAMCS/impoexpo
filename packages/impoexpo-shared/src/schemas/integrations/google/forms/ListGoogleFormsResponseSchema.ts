import * as v from "valibot";

export const ListGoogleFormsResponseInstanceSchema = v.required(
	v.object({
		id: v.pipe(v.string(), v.nonEmpty()),
		name: v.pipe(v.string(), v.nonEmpty()),
		description: v.optional(v.string()),
	}),
	["name", "id"],
);

export const ListGoogleFormsResponseSchema = v.array(
	ListGoogleFormsResponseInstanceSchema,
);

export type ListGoogleFormsResponse = v.InferOutput<
	typeof ListGoogleFormsResponseSchema
>;

export type ListGoogleFormsResponseInstance = v.InferOutput<
	typeof ListGoogleFormsResponseInstanceSchema
>;
