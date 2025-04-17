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

export const GoogleFormsLayoutItemSchema = object({
	id: pipe(string(), nonEmpty()),
	title: nullable(string()),
	description: nullable(string()),
	required: boolean(),
	type: pipe(string(), nonEmpty()),
});

export type GoogleFormsLayoutItem = InferOutput<
	typeof GoogleFormsLayoutItemSchema
>;

export const GoogleFormsLayoutSchema = object({
	documentTitle: pipe(string(), nonEmpty()),
	title: nullable(string()),
	description: nullable(string()),
	items: array(GoogleFormsLayoutItemSchema),
});

export type GoogleFormsLayout = InferOutput<typeof GoogleFormsLayoutSchema>;
