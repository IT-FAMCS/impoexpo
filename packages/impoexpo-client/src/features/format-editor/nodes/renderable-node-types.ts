// this is probably some of the worst typescript code i have ever written
// sorry

import type { AllowedObjectEntry, BaseNode } from "@impoexpo/shared";
import DefaultNodeRenderer from "../DefaultNodeRenderer";
import type { NodeTypes } from "@xyflow/react";
import type React from "react";
import { create } from "zustand";
import { persistStoreOnReload } from "@/stores/hot-reload";
import type { EnumSchema, OptionalSchema, PicklistSchema } from "valibot";

export type RenderableNodesStore = {
	nodeRenderers: NodeTypes;
	nodeRenderOptionsMap: Map<
		string,
		NodeRenderOptions<Record<string, AllowedObjectEntry>>
	>;
	categoryIconRenderers: Map<string, React.ReactNode>;
};

export type NodeRenderOptions<
	TSInput extends Record<string, AllowedObjectEntry>,
> = Partial<{
	categoryIcon: React.ReactNode;
	title: string;
	properties: Partial<{
		[key in keyof TSInput]: NodePropertyMetadata<TSInput[key]>;
	}>;
}>;

export type NodePropertyOptions<TProperty extends AllowedObjectEntry> =
	TProperty extends OptionalSchema<
		infer TWrappedSchema extends AllowedObjectEntry,
		unknown
	>
		? NodePropertyOptions<TWrappedSchema>
		: TProperty extends PicklistSchema<infer TOptions, undefined>
			? TOptions[number]
			: TProperty extends EnumSchema<
						infer TOptions extends Record<string, string | number>,
						undefined
					>
				? keyof TOptions
				: never;

export type NodePropertyMetadata<TProperty extends AllowedObjectEntry> =
	NodePropertyGenericMetadata &
		(NodePropertyOptions<TProperty> extends never
			? // biome-ignore lint/complexity/noBannedTypes: empty type required here
				{}
			: {
					options: Partial<
						Record<
							Exclude<NodePropertyOptions<TProperty>, bigint>,
							NodePropertyOptionsMetadata
						>
					>;
				});

export type NodePropertyGenericMetadata = Partial<{
	title: string;
	placeholder: string;
}>;

export type NodePropertyOptionsMetadata = Partial<{
	key: string;
	title: string;
	description: string;
}>;

export const registerWithDefaultRenderer = <
	TName extends string,
	TCategory extends string,
	TSInput extends Record<string, AllowedObjectEntry>,
	TSOutput extends Record<string, AllowedObjectEntry>,
>(
	node: BaseNode<TName, TCategory, TSInput, TSOutput>,
	options?: NodeRenderOptions<TSInput>,
) =>
	useRenderableNodesStore.setState((state) => {
		type NodeType = `${(typeof node)["category"]}-${(typeof node)["name"]}`;
		const type = `${node.category}-${node.name}`;
		return {
			nodeRenderers: Object.assign(state.nodeRenderers, {
				[type]: DefaultNodeRenderer<Record<string, unknown>, NodeType>,
			}),
			nodeRenderOptionsMap: new Map(state.nodeRenderOptionsMap).set(
				type,
				options ?? {},
			),
		};
	});

export const useRenderableNodesStore = create<RenderableNodesStore>(() => ({
	nodeRenderers: {},
	categoryIconRenderers: new Map(),
	nodeRenderOptionsMap: new Map(),
}));

export const registerCategoryIconRenderer = (
	name: string,
	icon: React.ReactNode,
) =>
	useRenderableNodesStore.setState((state) => {
		return {
			categoryIconRenderers: new Map(state.categoryIconRenderers).set(
				name,
				icon,
			),
		};
	});

persistStoreOnReload("renderableNodes", useRenderableNodesStore);
