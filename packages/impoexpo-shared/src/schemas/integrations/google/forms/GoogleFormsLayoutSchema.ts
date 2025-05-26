import * as v from "valibot";

export enum GoogleFormsQuestionType {
	CHOICE = "CHOICE",
	DATE = "DATE",
	FILE_UPLOAD = "FILE_UPLOAD",
	RATING = "RATING",
	SCALE = "SCALE",
	TEXT = "TEXT",
	TIME = "TIME",
}

export enum GoogleFormsChoiceQuestionType {
	RADIO = "RADIO",
	CHECKBOX = "CHECKBOX",
	DROP_DOWN = "DROP_DOWN",
}

export enum GoogleFormsFileType {
	ANY = "any",
	DOCUMENT = "document",
	PRESENTATION = "presentation",
	SPREADSHEET = "spreadsheet",
	DRAWING = "drawing",
	PDF = "pdf",
	IMAGE = "image",
	VIDEO = "video",
	AUDIO = "audio",
}

export const GoogleFormsLayoutItemSchema = v.object({
	id: v.pipe(v.string(), v.nonEmpty()),
	title: v.nullable(v.string()),
	description: v.nullable(v.string()),
	required: v.boolean(),
	type: v.pipe(v.string(), v.nonEmpty()),
	// only specify data that is useful FOR THE SERVER here!
	questionMetadata: v.variant("type", [
		v.object({
			type: v.literal(GoogleFormsQuestionType.CHOICE),
			choiceType: v.enum(GoogleFormsChoiceQuestionType),
		}),
		v.object({
			type: v.literal(GoogleFormsQuestionType.DATE),
			includeTime: v.boolean(),
			includeYear: v.boolean(),
		}),
		v.object({
			type: v.literal(GoogleFormsQuestionType.FILE_UPLOAD),
			allowMultiple: v.boolean(),
		}),
		v.object({ type: v.literal(GoogleFormsQuestionType.RATING) }),
		v.object({ type: v.literal(GoogleFormsQuestionType.SCALE) }),
		v.object({ type: v.literal(GoogleFormsQuestionType.TEXT) }),
		v.object({ type: v.literal(GoogleFormsQuestionType.TIME) }),
	]),
});

export type GoogleFormsLayoutItem = v.InferOutput<
	typeof GoogleFormsLayoutItemSchema
>;

export const GoogleFormsLayoutSchema = v.object({
	title: v.pipe(v.string(), v.nonEmpty()),
	description: v.nullable(v.string()),
	items: v.array(GoogleFormsLayoutItemSchema),
});

export type GoogleFormsLayout = v.InferOutput<typeof GoogleFormsLayoutSchema>;
