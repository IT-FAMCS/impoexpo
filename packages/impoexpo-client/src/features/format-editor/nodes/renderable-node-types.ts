import type { AllowedSchemaType, BaseNode } from "@impoexpo/shared";
import DefaultNodeRenderer from "../DefaultNodeRenderer";

const nodeRenders: Record<string, unknown> = {};

export const registerWithDefaultRenderer = <
	TName extends string,
	TCategory extends string,
	TIn extends AllowedSchemaType,
	TOut extends AllowedSchemaType,
>(
	node: BaseNode<TName, TCategory, TIn, TOut>,
) => {
	type NodeInputs = TIn extends undefined ? Record<string, unknown> : TIn;
	type NodeType = `${(typeof node)["category"]}-${(typeof node)["name"]}`;
	nodeRenders[`${node.category}-${node.name}`] = DefaultNodeRenderer<
		NodeInputs,
		NodeType
	>;
};
