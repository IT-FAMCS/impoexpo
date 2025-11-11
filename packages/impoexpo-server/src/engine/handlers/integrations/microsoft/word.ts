// todo: barely understandable code. try to bring back ~reduce()?
import type { WordPatchSchema } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import * as word from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { registerBaseNodes } from "@impoexpo/shared/nodes/node-database";
import {
	type MicrosoftWordGroupPatch,
	type MicrosoftWordListPatch,
	type MicrosoftWordPatch,
	MicrosoftWordPlaceholderType,
	type MicrosoftWordTextPatch,
} from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";
import { MicrosoftWordProjectIntegrationSchema } from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordProjectIntegrationSchema";
import { MICROSOFT_WORD_INTEGRATION_ID } from "@impoexpo/shared/schemas/integrations/microsoft/word/static";
import type { DateTime } from "luxon";
import { dateTimeFromAny } from "luxon-parser";
import * as v from "valibot";
import type { WordSorter } from "../../../../../../impoexpo-shared/src/nodes/integrations/microsoft/word";
import { dotnetRuntimeExports } from "../../../../integrations/microsoft/common/runtime";
import {
	genericRegisterAsyncHandler,
	genericRegisterHandler,
	type NodeHandlerFunction,
	registerHandler,
	registerIntegrationNodeHandlerRegistrar,
} from "../../../node-executor-utils";

type PatchMeta = {
	automaticSeparators: boolean;
	sorter?: WordSorter;
};

registerHandler(word.WORD_TEXT_SORTER_NODE, (ctx) => {
	return {
		sorter: {
			method: "text" as const,
			reverse: ctx.reverse,
			keys: [ctx.keys],
		},
	};
});

registerHandler(word.WORD_NUMBERS_SORTER_NODE, (ctx) => {
	return {
		sorter: {
			method: "numbers" as const,
			reverse: ctx.reverse,
			keys: [ctx.keys],
		},
	};
});

registerHandler(word.WORD_DATES_SORTER_NODE, (ctx) => {
	return {
		sorter: {
			method: "dates" as const,
			reverse: ctx.reverse,
			keys: [ctx.keys],
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
											sorter: ctx.__sorter as WordSorter | undefined,
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
											sorter: ctx.__sorter as WordSorter | undefined,
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

				const m = (v: unknown) => v as PatchMeta;
				const mergeSorters = (left?: WordSorter, right?: WordSorter) => {
					if (!left && !right) return undefined;
					if (!left) return right;
					if (!right) return left;
					return {
						...right,
						keys: [...left.keys, ...right.keys],
					} satisfies WordSorter;
				};

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
								__meta: {
									...m(right.__meta),
									sorter: mergeSorters(
										m(left.__meta).sorter,
										m(right.__meta).sorter,
									),
								} satisfies PatchMeta,
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
									right.__meta = {
										automaticSeparators: m(right.__meta).automaticSeparators,
										sorter: m(right.__meta).sorter
											? {
													...m(right.__meta).sorter!,
													keys: m(right.__meta).sorter!.keys.filter(
														(_, idx) =>
															idx !==
															rightGroup.groups.findIndex(
																(g) => g.title.text === group.title.text,
															),
													),
												}
											: undefined,
									} satisfies PatchMeta;
									const items = groups[index].items;
									for (const [key, value] of Object.entries(items))
										items[key] = merge(value, group.items[key]);
									groups[index].items = items;
								}
							}
							return {
								type: MicrosoftWordPlaceholderType.GROUP as const,
								groups: groups,
								__meta: {
									...m(right.__meta),
									sorter: mergeSorters(
										m(left.__meta).sorter,
										m(right.__meta).sorter,
									),
								},
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
						const createSorter = (
							sorter: WordSorter,
							values: string[],
							aIndex: number,
							bIndex: number,
						) => {
							if (values.length !== sorter.keys.length)
								throw new Error(
									`WordSorter's length does not match the length of values passed to patch: ${sorter.keys.length} =/= ${values.length}`,
								);
							const aKeys = sorter.keys[aIndex];
							const bKeys = sorter.keys[bIndex];

							const compareText = (a: string, b: string) =>
								a === b ? 0 : (sorter.reverse ? b > a : a > b) ? 1 : -1;
							const compareNumbers = (a: number, b: number) =>
								(sorter.reverse ? b : a) - (sorter.reverse ? a : b);
							const compareDates = (a: DateTime, b: DateTime) =>
								(sorter.reverse ? b : a).toMillis() -
								(sorter.reverse ? a : b).toMillis();

							switch (sorter.method) {
								case "text": {
									for (let i = 0; i < aKeys.length; i++) {
										const comparison = compareText(
											aKeys[i] as string,
											bKeys[i] as string,
										);
										if (comparison !== 0) return comparison;
									}
									return compareText(values[aIndex], values[bIndex]);
								}
								case "numbers": {
									for (let i = 0; i < aKeys.length; i++) {
										const comparison = compareNumbers(
											aKeys[i] as number,
											bKeys[i] as number,
										);
										if (comparison !== 0) return comparison;
									}
									const aNum = Number.parseInt(values[aIndex], 10);
									const bNum = Number.parseInt(values[bIndex], 10);
									const comparison =
										Number.isNaN(aNum) || Number.isNaN(bNum)
											? compareText(values[aIndex], values[bIndex])
											: compareNumbers(aNum, bNum);
									return comparison;
								}
								case "dates": {
									for (let i = 0; i < aKeys.length; i++) {
										const comparison = compareDates(
											aKeys[i] as DateTime,
											bKeys[i] as DateTime,
										);
										if (comparison !== 0) return comparison;
									}
									const aDate = dateTimeFromAny(values[aIndex]);
									const bDate = dateTimeFromAny(values[bIndex]);
									const comparison =
										!aDate.isValid || !bDate.isValid
											? compareText(values[aIndex], values[bIndex])
											: compareDates(aDate, bDate);
									return comparison;
								}
							}
						};

						if (patch.type === MicrosoftWordPlaceholderType.TEXT) return;
						const sorter = (patch.__meta as PatchMeta).sorter;
						if (!sorter) return;
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
										.map(([k, v]) => {
											const vStrings = v.map(
												(p) => (p as MicrosoftWordTextPatch).text,
											);
											return [
												k,
												v
													.map((p, idx) => ({ patch: p, index: idx }))
													.sort((a, b) =>
														createSorter(sorter, vStrings, a.index, b.index),
													)
													.map((obj) => obj.patch),
											];
										}),
								);
								return;
							}
							case MicrosoftWordPlaceholderType.GROUP: {
								const groupStrings = patch.groups.map((g) => g.title.text);
								patch.groups = patch.groups
									.map((g, idx) => ({ group: g, index: idx }))
									.sort((a, b) =>
										createSorter(sorter, groupStrings, a.index, b.index),
									)
									.map((obj) => obj.group);
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
