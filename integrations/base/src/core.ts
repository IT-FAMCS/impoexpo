import { defineNodeBundle } from "@impoexpo/integrations-api/core/bundle";
import { staticNode } from "@impoexpo/integrations-api/core/node";
import { s } from "@impoexpo/integrations-api/core/schemas";

export default defineNodeBundle("base", {
	ADD_NODE: staticNode(
		"add",
		s.object({
			a: s.number(),
			b: s.number(),
		}),
		s.object({
			result: s.number(),
		}),
	),
});
