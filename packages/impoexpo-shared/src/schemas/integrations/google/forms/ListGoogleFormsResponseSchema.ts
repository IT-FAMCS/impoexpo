import { type } from "arktype";

export const ListGoogleFormSchema = type({
	id: "string > 0",
	name: "string > 0",
	"description?": "string > 0",
});

export const ListGoogleFormsResponseSchema = ListGoogleFormSchema.array();

export type ListGoogleForm = typeof ListGoogleFormSchema.infer;
export type ListGoogleFormsResponse =
	typeof ListGoogleFormsResponseSchema.infer;
