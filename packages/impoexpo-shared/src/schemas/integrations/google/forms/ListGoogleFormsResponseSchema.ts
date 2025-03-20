import {
	object,
	pipe,
	string,
	nonEmpty,
	email,
	url,
	number,
	type InferOutput,
	required,
	optional,
	array,
} from "valibot";

export const ListGoogleFormSchema = object({
	id: pipe(string(), nonEmpty()),
	name: pipe(string(), nonEmpty()),
	description: optional(pipe(string(), nonEmpty())),
});

export const ListGoogleFormsResponseSchema = array(ListGoogleFormSchema);

export type ListGoogleForm = InferOutput<typeof ListGoogleFormSchema>;
export type ListGoogleFormsResponse = InferOutput<
	typeof ListGoogleFormsResponseSchema
>;
