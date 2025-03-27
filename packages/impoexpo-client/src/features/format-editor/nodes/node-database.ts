import { create } from "@orama/orama";
import { language, stemmer } from "@orama/stemmers/russian";

import "./builtin/console";
import "./builtin/notifications";

export const nodesDatabase = create({
	schema: {
		title: "string",
		name: "string",
		category: "string",
		id: "string",
		tags: "string[]",
	},
	components: {
		tokenizer: {
			stemming: true,
			stemmerSkipProperties: ["id", "tags"],
			stemmer,
			language,
		},
	},
});
