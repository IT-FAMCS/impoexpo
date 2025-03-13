import * as v from "valibot";

const ListGoogleFormsResponseSchema = v.array(
	v.required(
		v.object({
			id: v.pipe(v.string(), v.nonEmpty()),
			name: v.pipe(v.string(), v.nonEmpty()),
			description: v.string(),
		}),
		["name", "id"],
	),
);

type ListGoogleFormsResponse = v.InferOutput<
	typeof ListGoogleFormsResponseSchema
>;

export { type ListGoogleFormsResponse, ListGoogleFormsResponseSchema };
