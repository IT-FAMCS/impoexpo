import {
	genericRegisterAsyncHandler,
	genericRegisterHandler,
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
	type MicrosoftWordPatch,
	type MicrosoftWordTextPatch,
	MicrosoftWordGroupedListItem,
	MicrosoftWordPlaceholderType,
} from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";
//import type { WordPatchSchema } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { MICROSOFT_WORD_INTEGRATION_ID } from "@impoexpo/shared/schemas/integrations/microsoft/word/static";
import { dotnetRuntimeExports } from "../../../../integrations/microsoft/common/runtime";
import { WordPatchSchema } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { logger } from "../../../../logger";

/* registerHandler(word.WORD_TEXT_NODE, (ctx) => {
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

	if (ctx.automaticSeparators) {
		// TODO: having this behavior hardcoded is probably
		// not a good solution. however, implementing this
		// manually is WAY harder and is out of the scope of
		// a 1.0 release.
		for (let idx = 0; idx < items.length; idx++) {
			if (items[idx].type === MicrosoftWordPlaceholderType.TEXT) {
				(items[idx] as MicrosoftWordTextPatch).text +=
					idx === items.length - 1 ? "." : ";";
			}
		}
	}

	return {
		result: {
			type: MicrosoftWordPlaceholderType.LIST as const,
			sublistTitle: ctx.sublistTitle,
			items: items,
		},
	};
});

registerAsyncHandler(word.WORD_GROUPED_LIST_NODE, async (ctx) => {
	if (ctx.automaticSeparators) {
		// TODO: having this behavior hardcoded is probably
		// not a good solution. however, implementing this
		// manually is WAY harder and is out of the scope of
		// a 1.0 release.
		for (const [, patches] of ctx.groups.entries()) {
			for (let idx = 0; idx < patches.length; idx++) {
				if (patches[idx].type === MicrosoftWordPlaceholderType.TEXT) {
					(patches[idx] as MicrosoftWordTextPatch).text +=
						idx === patches.length - 1 ? "." : ";";
				}
			}
		}
	}

	return {
		result: {
			type: MicrosoftWordPlaceholderType.GROUPED_LIST as const,
			groups: Array.from(ctx.groups.entries()).map(([k, v]) => ({
				title: k,
				items: v,
			})),
		},
	};
}); */

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
			const data = word.createWordDocumentBaseNode(
				document.clientIdentifier,
				document.layout,
			);

			for (const [key, placeholder] of Object.entries(data.placeholders)) {
				registerBaseNodes(placeholder.node);
				switch (placeholder.layout.type) {
					case MicrosoftWordPlaceholderType.TEXT:
						genericRegisterHandler(handlers, placeholder.node, (ctx) => {
							logger.debug(`${key} TEXT ${JSON.stringify(ctx.text)}`);
							logger.debug("--------------------------");
							return {
								result: {
									type: MicrosoftWordPlaceholderType.TEXT as const,
									text: ctx.text,
								},
							};
						});
						break;
					case MicrosoftWordPlaceholderType.LIST:
						genericRegisterAsyncHandler(
							handlers,
							placeholder.node,
							async (ctx) => {
								const children = placeholder.layout.children.map((c) => c.name);

								const items = await ctx["~reduce"](
									(acc, cur) => {
										for (const child of children) {
											if (!(child in acc)) acc[child] = [];
											const element = cur[child] as v.InferOutput<
												typeof WordPatchSchema
											>;
											if (!acc[child].includes(element))
												acc[child].push(element);
										}
										return acc;
									},
									{} as Record<string, v.InferOutput<typeof WordPatchSchema>[]>,
								);

								logger.debug(`${key} LIST REDUCER ${JSON.stringify(items)}`);
								logger.debug("--------------------------");

								if (ctx.automaticSeparators) {
									// TODO: having this behavior hardcoded is probably
									// not a good solution. however, implementing this
									// manually is WAY harder and is out of the scope of
									// a 1.0 release.
									const values = Object.values(items).flat();
									for (let idx = 0; idx < values.length; idx++) {
										if (
											values[idx].type === MicrosoftWordPlaceholderType.TEXT
										) {
											(values[idx] as MicrosoftWordTextPatch).text +=
												idx === values.length - 1 ? "." : ";";
										}
									}
								}

								return {
									result: {
										type: MicrosoftWordPlaceholderType.LIST as const,
										items: items,
									},
								};
							},
						);
						break;
					case MicrosoftWordPlaceholderType.GROUP:
						genericRegisterAsyncHandler(
							handlers,
							placeholder.node,
							async (ctx) => {
								const children = placeholder.layout.children.map((c) => c.name);

								const groups = await ctx["~reduce"]((acc, cur) => {
									if (acc.some((g) => g.title.text === cur.__title)) return acc;
									acc.push({
										title: {
											type: MicrosoftWordPlaceholderType.TEXT,
											text: cur.__title as string,
										},
										items: children.reduce(
											(acc, child) => {
												acc[child] = cur[child] as v.InferOutput<
													typeof WordPatchSchema
												>;
												return acc;
											},
											{} as Record<
												string,
												v.InferOutput<typeof WordPatchSchema>
											>,
										),
									});

									return acc;
								}, [] as MicrosoftWordGroupedListItem[]);

								logger.debug(`${key} GROUP REDUCER ${JSON.stringify(groups)}`);
								logger.debug("--------------------------");

								return {
									result: {
										type: MicrosoftWordPlaceholderType.GROUP as const,
										groups,
									},
								};
							},
						);
						break;
				}
			}

			registerBaseNodes(data.document);
			genericRegisterAsyncHandler(handlers, data.document, async (ctx) => {
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
				console.warn(serializedPatches);
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
