import {
	array,
	boolean,
	nonEmpty,
	nullable,
	object,
	pipe,
	string,
	type InferOutput,
} from "valibot";

export const googleFormsLayoutItem = object({
	id: pipe(string(), nonEmpty()),
	title: nullable(string()),
	description: nullable(string()),
	required: boolean(),
	type: pipe(string(), nonEmpty()),
});

export type GoogleFormsLayoutItem = InferOutput<typeof googleFormsLayoutItem>;

export const googleFormsLayoutSchema = object({
	documentTitle: pipe(string(), nonEmpty()),
	title: nullable(string()),
	description: nullable(string()),
	items: array(googleFormsLayoutItem),
});

export type GoogleFormsLayout = InferOutput<typeof googleFormsLayoutSchema>;
