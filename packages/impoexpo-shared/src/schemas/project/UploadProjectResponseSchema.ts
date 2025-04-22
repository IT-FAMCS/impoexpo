import { object } from "valibot";
import * as v from "valibot";

export const UploadProjectResponseSchema = object({
	job: v.pipe(v.string(), v.nonEmpty()),
});

export type UploadProjectResponse = v.InferOutput<
	typeof UploadProjectResponseSchema
>;
