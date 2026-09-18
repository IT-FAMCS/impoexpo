import { NodeBase } from "./node";

export class NodeBundle<TNodes extends Record<string, NodeBase>> {
	category: string;
	nodes: TNodes;

	constructor(_category: string, _nodes: TNodes) {
		this.category = _category;
		this.nodes = _nodes;
	}
}

export const defineNodeBundle = <TNodes extends Record<string, NodeBase>>(
	category: string,
	nodes?: TNodes,
) => new NodeBundle(category, nodes ?? {});
