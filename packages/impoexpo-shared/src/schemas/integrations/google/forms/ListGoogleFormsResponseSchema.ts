import * as v from "valibot";

const ListGoogleFormsResponseInstanceSchema = v.required(
	v.object({
		id: v.pipe(v.string(), v.nonEmpty()),
		name: v.pipe(v.string(), v.nonEmpty()),
		description: v.optional(v.string()),
	}),
	["name", "id"],
);

const ListGoogleFormsResponseSchema = v.array(
	ListGoogleFormsResponseInstanceSchema,
);

type ListGoogleFormsResponse = v.InferOutput<
	typeof ListGoogleFormsResponseSchema
>;

type ListGoogleFormsResponseInstance = v.InferOutput<
	typeof ListGoogleFormsResponseInstanceSchema
>;

export {
	type ListGoogleFormsResponse,
	type ListGoogleFormsResponseInstance,
	ListGoogleFormsResponseInstanceSchema,
	ListGoogleFormsResponseSchema,
};
