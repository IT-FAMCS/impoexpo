import {
	genericRegisterAsyncHandler,
	genericRegisterHandler,
	type NodeHandlerFunction,
	registerIntegrationNodeHandlerRegistrar,
} from "../../../node-executor-utils";
import * as v from "valibot";
import * as word from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { MicrosoftWordProjectIntegrationSchema } from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordProjectIntegrationSchema";
import { registerBaseNodes } from "@impoexpo/shared/nodes/node-database";
import {
	type MicrosoftWordPatch,
	type MicrosoftWordTextPatch,
	type MicrosoftWordGroupPatch,
	type MicrosoftWordListPatch,
	MicrosoftWordPlaceholderType,
} from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";
import { MICROSOFT_WORD_INTEGRATION_ID } from "@impoexpo/shared/schemas/integrations/microsoft/word/static";
import { dotnetRuntimeExports } from "../../../../integrations/microsoft/common/runtime";
import type { WordPatchSchema } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { dateTimeFromAny } from "luxon-parser";

type PatchMeta = {
	automaticSeparators: boolean;
	sortMethod: word.WordSortMethod;
	reverseSort: boolean;
};

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

		for (const document of integration.data.documents) {
			const data = word.createWordDocumentBaseNode(
				document.clientIdentifier,
				document.layout,
			);

			for (const [, placeholder] of Object.entries(data.placeholders)) {
				registerBaseNodes(placeholder.node);
				switch (placeholder.layout.type) {
					case MicrosoftWordPlaceholderType.TEXT:
						genericRegisterHandler(handlers, placeholder.node, (ctx) => {
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

								const items: Record<
									string,
									v.InferOutput<typeof WordPatchSchema>[]
								> = {};
								for (const child of children) {
									if (!(child in items)) items[child] = [];
									const element = ctx[child] as v.InferOutput<
										typeof WordPatchSchema
									>;
									if (!items[child].includes(element))
										items[child].push(element);
								}

								return {
									result: {
										type: MicrosoftWordPlaceholderType.LIST as const,
										items: items,
										__meta: {
											sortMethod: ctx.__sortMethod as word.WordSortMethod,
											reverseSort: ctx.__reverseSort as boolean,
											automaticSeparators: ctx.__automaticSeparators as boolean,
										} satisfies PatchMeta,
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

								const groups = [
									{
										title: {
											type: MicrosoftWordPlaceholderType.TEXT,
											text: ctx.__title as string,
										},
										items: children.reduce(
											(acc, child) => {
												acc[child] = ctx[child] as v.InferOutput<
													typeof WordPatchSchema
												>;
												return acc;
											},
											{} as Record<
												string,
												v.InferOutput<typeof WordPatchSchema>
											>,
										),
									},
								];

								return {
									result: {
										type: MicrosoftWordPlaceholderType.GROUP as const,
										groups,
										__meta: {
											sortMethod: ctx.__sortMethod as word.WordSortMethod,
											reverseSort: ctx.__reverseSort as boolean,
											automaticSeparators: false,
										} satisfies PatchMeta,
									},
								};
							},
						);
						break;
				}
			}

			registerBaseNodes(data.document);
			genericRegisterAsyncHandler(handlers, data.document, async (ctx) => {
				const iterators = ctx["~iterators"]();
				const patches = ctx["~persist"]<Record<string, MicrosoftWordPatch>>(
					"patches",
					{},
				)();

				// right is the newer one
				const merge = (
					left: MicrosoftWordPatch,
					right: MicrosoftWordPatch,
				): MicrosoftWordPatch => {
					if (left.type !== right.type)
						throw new Error(
							`cannot merge word patches of different types (${left.type} !== ${right.type})`,
						);
					switch (left.type) {
						case MicrosoftWordPlaceholderType.TEXT:
							return right;
						case MicrosoftWordPlaceholderType.LIST: {
							const rightList = right as MicrosoftWordListPatch;
							const items = left.items;
							for (const [key, values] of Object.entries(rightList.items)) {
								if (key in items) items[key] = [...items[key], ...values];
								else items[key] = values;
							}
							return {
								type: MicrosoftWordPlaceholderType.LIST as const,
								items: items,
								__meta: right.__meta,
							};
						}
						case MicrosoftWordPlaceholderType.GROUP: {
							const rightGroup = right as MicrosoftWordGroupPatch;
							const groups = left.groups;
							for (const group of rightGroup.groups) {
								const index = groups.findIndex(
									(g) => g.title.text === group.title.text,
								);
								if (index === -1) groups.push(group);
								else {
									const items = groups[index].items;
									for (const [key, value] of Object.entries(items))
										items[key] = merge(value, group.items[key]);
									groups[index].items = items;
								}
							}
							return {
								type: MicrosoftWordPlaceholderType.GROUP as const,
								groups: groups,
								__meta: right.__meta,
							};
						}
					}
				};

				// merge previous results
				for (const placeholder of document.layout.placeholders) {
					if (ctx[placeholder.name]) {
						if (!(placeholder.name in patches))
							patches[placeholder.name] = ctx[
								placeholder.name
							] as MicrosoftWordPatch;
						else
							patches[placeholder.name] = merge(
								patches[placeholder.name],
								ctx[placeholder.name] as MicrosoftWordPatch,
							);
					}
				}

				if (iterators.isLastIteration()) {
					// postprocess
					const sort = (patch: MicrosoftWordPatch) => {
						const getSorter = (
							method: word.WordSortMethod,
							reverse: boolean,
						) => {
							switch (method) {
								case "text":
									return (a: string, b: string) =>
										(reverse ? b > a : a > b) ? 1 : -1;
								case "none":
									return () => 0;
								case "numbers":
									return (a: string, b: string) => {
										const aNum = Number.parseInt(a, 10);
										const bNum = Number.parseInt(b, 10);
										if (Number.isNaN(aNum) || Number.isNaN(bNum)) return 0;
										return (reverse ? bNum : aNum) - (reverse ? aNum : bNum);
									};
								case "dates":
									return (a: string, b: string) => {
										const aDate = dateTimeFromAny(a);
										const bDate = dateTimeFromAny(b);
										if (!aDate.isValid || !bDate.isValid) return 0;
										return (
											(reverse ? bDate : aDate).toMillis() -
											(reverse ? aDate : bDate).toMillis()
										);
									};
							}
						};

						if (patch.type === MicrosoftWordPlaceholderType.TEXT) return;
						const meta = patch.__meta as PatchMeta;
						if (meta.sortMethod === "none") return;
						switch (patch.type) {
							case MicrosoftWordPlaceholderType.LIST: {
								// only sort text patches
								patch.items = Object.fromEntries(
									Object.entries(patch.items)
										.filter(
											([, v]) =>
												!v.some(
													(p) => p.type !== MicrosoftWordPlaceholderType.TEXT,
												),
										)
										.map(([k, v]) => [
											k,
											v.sort((a, b) =>
												getSorter(meta.sortMethod, meta.reverseSort)(
													(a as MicrosoftWordTextPatch).text,
													(b as MicrosoftWordTextPatch).text,
												),
											),
										]),
								);
								return;
							}
							case MicrosoftWordPlaceholderType.GROUP: {
								patch.groups = patch.groups.sort((a, b) =>
									getSorter(meta.sortMethod, meta.reverseSort)(
										a.title.text,
										b.title.text,
									),
								);
								return;
							}
						}
					};

					const postprocess = (patch: MicrosoftWordPatch) => {
						sort(patch);
						switch (patch.type) {
							case MicrosoftWordPlaceholderType.TEXT:
								break;
							case MicrosoftWordPlaceholderType.LIST: {
								for (const [key, items] of Object.entries(patch.items))
									patch.items[key] = items.map((i) => postprocess(i));
								const meta = patch.__meta as PatchMeta;
								if (meta.automaticSeparators) {
									const items = Object.values(patch.items)
										.flat()
										.filter(
											(p) => p.type === MicrosoftWordPlaceholderType.TEXT,
										);
									// TODO: having this behavior hardcoded is probably
									// not a good solution. however, implementing this
									// manually is WAY harder and is out of the scope of
									// a 1.0 release.
									for (let idx = 0; idx < items.length; idx++) {
										(items[idx] as MicrosoftWordTextPatch).text +=
											idx === items.length - 1 ? "." : ";";
									}
								}
								break;
							}
							case MicrosoftWordPlaceholderType.GROUP: {
								for (const group of patch.groups) {
									group.items = Object.fromEntries(
										Object.entries(group.items).map(([k, v]) => [
											k,
											postprocess(v),
										]),
									);
								}
								break;
							}
						}
						return patch;
					};
					for (const [key, patch] of Object.entries(patches))
						patches[key] = postprocess(patch);

					const patchMethod =
						//@ts-expect-error
						dotnetRuntimeExports.SimpleOfficePatchers.Patchers.WordPatcher
							.PatchDocument;
					if (!patchMethod) {
						throw new Error(
							"SimpleOfficePatchers was not initialized (SimpleOfficePatchers.Patchers.WordPatcher.PatchDocument() was not found)",
						);
					}

					const serializedPatches = JSON.stringify(patches, (k, v) =>
						k === "__meta" ? undefined : v,
					);
					const buffer = await patchMethod(
						ctx["~job"].files[document.clientIdentifier],
						serializedPatches,
					);
					ctx["~job"].file(
						document.filename.replaceAll(".docx", "-patched.docx"),
						"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
						buffer,
					);
				}
			});
		}

		return handlers;
	},
);
