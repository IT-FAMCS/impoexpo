import type { AllowedObjectEntry, BaseNode } from "@impoexpo/shared";
import DefaultNodeRenderer from "../DefaultNodeRenderer";
import type { NodeTypes } from "@xyflow/react";
import type React from "react";
import { create } from "zustand";

export type RenderableNodesStore = {
	nodeRenderers: NodeTypes;
	nodeRenderOptionsMap: Map<string, NodeRenderOptions<unknown>>;
	categoryIconRenderers: Map<string, React.ReactNode>;
};

export type RenderableNodesStoreActions = {
	registerWithDefaultRenderer: <
		TName extends string,
		TCategory extends string,
		TSInput extends Record<string, AllowedObjectEntry>,
		TSOutput extends Record<string, AllowedObjectEntry>,
	>(
		node: BaseNode<TName, TCategory, TSInput, TSOutput>,
		options?: NodeRenderOptions<TSInput>,
	) => void;

	registerCategoryIcon: (name: string, icon: React.ReactNode) => void;
};

export const useRenderableNodesStore = create<
	RenderableNodesStore & RenderableNodesStoreActions
>((set) => ({
	nodeRenderers: {},
	categoryIconRenderers: new Map(),
	nodeRenderOptionsMap: new Map(),

	registerWithDefaultRenderer<
		TName extends string,
		TCategory extends string,
		TSInput extends Record<string, AllowedObjectEntry>,
		TSOutput extends Record<string, AllowedObjectEntry>,
	>(
		node: BaseNode<TName, TCategory, TSInput, TSOutput>,
		options?: NodeRenderOptions<TSInput>,
	) {
		type NodeInputs = TSInput extends unknown
			? Record<string, unknown>
			: TSInput;
		type NodeType = `${(typeof node)["category"]}-${(typeof node)["name"]}`;
		const type = `${node.category}-${node.name}`;
		set((state) => ({
			nodeRenderers: {
				...state.nodeRenderers,
				type: DefaultNodeRenderer<NodeInputs, NodeType>,
			},
			nodeRenderOptionsMap: new Map(state.nodeRenderOptionsMap).set(
				type,
				options ?? {},
			),
		}));
	},
	registerCategoryIcon(name, icon) {
		set((state) => ({
			categoryIconRenderers: new Map(state.categoryIconRenderers).set(
				name,
				icon,
			),
		}));
	},
}));

export type NodeRenderOptions<
	TSInput extends Record<string, AllowedObjectEntry> | unknown,
> = Partial<{
	categoryIcon: React.ReactNode;
	title: string;
	properties: Partial<
		Record<
			TSInput extends Record<string, AllowedObjectEntry>
				? keyof TSInput
				: string,
			string
		>
	>;
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
	useRenderableNodesStore.getState().registerWithDefaultRenderer(node, options);

export const registerCategoryIconRenderer = (
	name: string,
	icon: React.ReactNode,
) => useRenderableNodesStore.getState().registerCategoryIcon(name, icon);
