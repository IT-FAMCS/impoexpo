import { create as createDatabase, type Orama } from "@orama/orama";

import "./builtin/console";
import "./builtin/notifications";
import "./builtin/math";
import "./builtin/strings";
import "./builtin/conditional";

import { create } from "zustand/react";
import { supportedLocales } from "@/locales/supportedLocales";

const searchInitializers: Array<
	(database: Orama<typeof nodesDatabaseSchema>) => void
> = new Array();
export const searchScope = (
	initializer: (database: Orama<typeof nodesDatabaseSchema>) => void,
) => searchInitializers.push(initializer);

export const nodesDatabaseSchema = {
	title: "string" as const,
	name: "string" as const,
	category: "string" as const,
	id: "string" as const,
	aliases: "string[]" as const,
	tags: "enum[]" as const,
};

export type NodeSearchMetadataStore = {
	database: Orama<typeof nodesDatabaseSchema> | undefined;
	reset: (localeId: string) => void;
};

export const useNodeSearchMetadataStore = create<NodeSearchMetadataStore>(
	(set) => ({
		database: undefined,
		reset: (localeId: string) => {
			const locale = supportedLocales.find((l) => l.id === localeId);
			if (!locale) return;

			console.log(`(re)creating the search database for locale ${locale.id}`);
			const database = createDatabase<typeof nodesDatabaseSchema>({
				schema: nodesDatabaseSchema,
				components: {
					tokenizer: {
						stemming: true,
						stemmerSkipProperties: ["id", "tags"],
						...locale.oramaMetadata,
					},
				},
			});
			for (const initializer of searchInitializers) initializer(database);
			set(() => ({ database: database }));
		},
	}),
);
