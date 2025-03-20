import type { AllowedObjectEntry, BaseNode } from "@impoexpo/shared";
import DefaultNodeRenderer from "../DefaultNodeRenderer";
import type { NodeTypes } from "@xyflow/react";
import type { BaseIssue, GenericSchema } from "valibot";

export const nodeRenderers: NodeTypes = {};
export const categoryIconRenderers: Map<string, React.ReactNode> = new Map();

export const registerWithDefaultRenderer = <
	TName extends string,
	TCategory extends string,
	TSInput extends Record<string, AllowedObjectEntry>,
	TSOutput extends Record<string, AllowedObjectEntry>,
>(
	node: BaseNode<TName, TCategory, TSInput, TSOutput>,
) => {
	type NodeInputs = TSInput extends unknown ? Record<string, unknown> : TSInput;
	type NodeType = `${(typeof node)["category"]}-${(typeof node)["name"]}`;
	nodeRenderers[`${node.category}-${node.name}`] = DefaultNodeRenderer<
		NodeInputs,
		NodeType
	>;
};

export const registerCategoryIconRenderer = (
	name: string,
	icon: React.ReactNode,
) => categoryIconRenderers.set(name, icon);
