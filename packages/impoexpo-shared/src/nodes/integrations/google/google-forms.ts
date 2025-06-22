import * as v from "valibot";
import type { GoogleFormsLayout } from "../../../schemas/integrations/google/forms/GoogleFormsLayoutSchema";
import { BaseNode } from "../../node-types";
import {
	registerCustomType,
	schemaFromString,
} from "../../schema-string-conversions";
import { GOOGLE_FORMS_INTEGRATION_ID } from "../../../schemas/integrations/google/forms/static";

export const GoogleFormsFileSchema = registerCustomType(
	"GoogleFormsFile",
	() => ({
		owner: v.string(),
		name: v.string(),
		id: v.string(),
		link: v.string(),
		type: v.string(),
	}),
);
export type GoogleFormsFile = v.InferOutput<typeof GoogleFormsFileSchema>;

export const createGoogleFormsBaseNode = (
	id: string,
	layout: GoogleFormsLayout,
) => {
	const entries: v.ObjectEntries = {};
	for (const item of layout.items)
		entries[item.id] = schemaFromString(item.type);

	return new BaseNode({
		category: GOOGLE_FORMS_INTEGRATION_ID,
		name: `form-${id}`,
		outputSchema: v.object(entries),
		iterable: true,
		integration: true,
	});
};
