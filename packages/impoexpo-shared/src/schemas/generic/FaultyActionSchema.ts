import { type } from "arktype";

export const FaultyActionSchema = type({
	ok: "boolean",
	"internal?": "boolean",
	"error?": "string",
});

export type FaultyAction = typeof FaultyActionSchema.infer;
