import * as v from "valibot";
import type { GoogleFormsLayout } from "../../../schemas/integrations/google/forms/GoogleFormsLayoutSchema";
import { BaseNode } from "../../node-types";
import { schemaFromString } from "../../schema-string-conversions";
import { named } from "../../node-utils";

const getEntries = (layout: GoogleFormsLayout) => {
	const entries: v.ObjectEntries = {};
	for (const item of layout.items)
		entries[item.id] = schemaFromString(item.type);
	return entries;
};

const createResponseObject = (id: string, layout: GoogleFormsLayout) =>
	named(`GoogleFormsResponse-${id.slice(0, 5)}`, v.object(getEntries(layout)));

export const createGoogleFormsBaseNode = (
	id: string,
	layout: GoogleFormsLayout,
) => {
	return new BaseNode({
		category: "google-forms",
		name: `form-${id}`,
		outputSchema: v.object({
			responses: v.array(createResponseObject(id, layout)),
		}),
	});
};

export const createGoogleFormsResponseBaseNode = (
	id: string,
	layout: GoogleFormsLayout,
) => {
	return new BaseNode({
		category: "google-forms",
		name: `form-${id}-response`,
		inputSchema: v.object({
			response: createResponseObject(id, layout),
		}),
		outputSchema: v.object(createResponseObject(id, layout).entries),
	});
};
