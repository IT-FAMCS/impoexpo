import {
	genericRegisterAsyncHandler,
	type NodeHandlerFunction,
	registerAsyncHandler,
	registerHandler,
	registerIntegrationNodeHandlerRegistrar,
} from "../../../node-executor-utils";
import * as v from "valibot";
import * as word from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { MicrosoftWordProjectIntegrationSchema } from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordProjectIntegrationSchema";
import { registerBaseNodes } from "@impoexpo/shared/nodes/node-database";
import {
	type MicrosoftWordGroupedListItem,
	type MicrosoftWordPatch,
	MicrosoftWordPlaceholderType,
} from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";
import type { WordPatchSchema } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { MICROSOFT_WORD_INTEGRATION_ID } from "@impoexpo/shared/schemas/integrations/microsoft/word/static";
import { dotnetRuntimeExports } from "../../../../integrations/microsoft/common/runtime";
import { logger } from "../../../../logger";
registerHandler(word.WORD_TEXT_NODE, (ctx) => {
	return {
		result: {
			type: MicrosoftWordPlaceholderType.TEXT as const,
			text: ctx.text,
		},
	};
});

registerAsyncHandler(word.WORD_LIST_NODE, async (ctx) => {
	const items = await ctx["~reduce"]<v.InferOutput<typeof WordPatchSchema>[]>(
		(acc, cur) => {
			acc.push(
				...cur.items.map((i) => i as v.InferOutput<typeof WordPatchSchema>),
			);
			return acc;
		},
		[],
	);
	return {
		result: {
			type: MicrosoftWordPlaceholderType.LIST as const,
			sublistTitle: ctx.sublistTitle,
			items: items,
		},
	};
});

registerAsyncHandler(word.WORD_GROUPED_LIST_NODE, async (ctx) => {
	const groups = await ctx["~reduce"]<
		Record<string, MicrosoftWordGroupedListItem>
	>((acc, cur) => {
		if (!(cur.groupBy in acc))
			acc[cur.groupBy] = { items: cur.items, title: cur.title };
		else
			acc[cur.groupBy] = {
				items: acc[cur.groupBy].items.concat(cur.items),
				title: acc[cur.groupBy].title,
			};
		return acc;
	}, {});
	return {
		result: {
			type: MicrosoftWordPlaceholderType.GROUPED_LIST as const,
			groups: Object.values(groups),
		},
	};
});

registerIntegrationNodeHandlerRegistrar(
	MICROSOFT_WORD_INTEGRATION_ID,
	(project) => {
		const integration = project.integrations["microsoft-word"];
		if (
			!integration ||
			!v.is(MicrosoftWordProjectIntegrationSchema, integration)
		)
			throw new Error();

		const handlers: Record<
			string,
			NodeHandlerFunction<v.ObjectEntries, v.ObjectEntries>
		> = {};

		const generated: Record<string, boolean> = {};
		for (const document of integration.data.documents) {
			const base = word.createWordDocumentBaseNode(
				document.clientIdentifier,
				document.layout,
			);
			registerBaseNodes(base);

			genericRegisterAsyncHandler(handlers, base, async (ctx) => {
				if (document.clientIdentifier in generated) return;

				const patches: Record<string, MicrosoftWordPatch> = {};
				for (const placeholder of document.layout.placeholders) {
					if (ctx[placeholder.name]) {
						patches[placeholder.name] = ctx[
							placeholder.name
						] as MicrosoftWordPatch;
					}
				}

				const patchMethod =
					//@ts-ignore
					dotnetRuntimeExports.SimpleOfficePatchers.Patchers.WordPatcher
						.PatchDocument;
				if (!patchMethod) {
					throw new Error(
						"SimpleOfficePatchers was not initialized (SimpleOfficePatchers.Patchers.WordPatcher.PatchDocument() was not found)",
					);
				}

				const serializedPatches = JSON.stringify(patches);
				const buffer = await patchMethod(
					ctx["~job"].files[document.clientIdentifier],
					serializedPatches,
				);
				ctx["~job"].file(
					document.filename.replaceAll(".docx", "-patched.docx"),
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
					buffer,
				);

				generated[document.clientIdentifier] = true;
			});
		}

		return handlers;
	},
);
