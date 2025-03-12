import * as v from "valibot";

const ListGoogleFormsResponseSchema = v.array(
	v.required(
		v.object({
			name: v.string(),
			description: v.string(),
		}),
		["name"],
	),
);

type ListGoogleFormsResponse = v.InferOutput<
	typeof ListGoogleFormsResponseSchema
>;

export { type ListGoogleFormsResponse, ListGoogleFormsResponseSchema };
