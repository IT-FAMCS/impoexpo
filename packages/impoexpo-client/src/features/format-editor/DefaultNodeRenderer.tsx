import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { baseNodesMap } from "@impoexpo/shared";
import { type NodeProps, type Node, Position, Handle } from "@xyflow/react";
import { useMemo } from "react";
import { useRenderableNodesStore } from "./nodes/renderable-node-types";

export default function DefaultNodeRenderer<
	TIn extends Record<string, unknown>,
	TType extends string,
>({ type }: NodeProps<Node<TIn, TType>>) {
	const { nodeRenderOptionsMap, categoryIconRenderers } =
		useRenderableNodesStore();

	const nodeData = useMemo(() => {
		const data = baseNodesMap.get(type);
		if (data === undefined)
			throw new Error(
				`attempted to get node data of a non-registered node with type "${type}"`,
			);
		return data;
	}, [type]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: .get() of a map in dependencies is absurd
	const nodeRenderOptions = useMemo(() => {
		const options = nodeRenderOptionsMap.get(type);
		if (options === undefined)
			throw new Error(
				`attempted to get node render options of a non-registered node with type "${type}"`,
			);
		return options;
	}, [type]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: same as above
	const categoryIcon = useMemo(() => {
		return (
			nodeRenderOptions.categoryIcon ??
			(categoryIconRenderers.has(nodeData.category)
				? categoryIconRenderers.get(nodeData.category)
				: null)
		);
	}, [nodeRenderOptions.categoryIcon, nodeData.category]);

	return (
		<Card classNames={{ body: "p-0" }}>
			<CardHeader className="flex flex-row gap-2">
				{categoryIcon}
				<p>{nodeRenderOptions.title ?? nodeData.name}</p>
			</CardHeader>
			<Divider />
			<CardBody className="flex flex-col py-2 overflow-visible">
				{nodeData.inputSchema &&
					Object.keys(nodeData.inputSchema.entries).map((name) => (
						<div key={name} className="relative flex px-4 py-2">
							<p>
								{Object.keys(nodeRenderOptions.properties ?? {}).includes(name)
									? // biome-ignore lint/style/noNonNullAssertion: verified above
										nodeRenderOptions.properties![name]
									: name}
							</p>
							<Handle
								type="target"
								position={Position.Left}
								style={{ left: 0 }}
							/>
						</div>
					))}
			</CardBody>
		</Card>
	);
}
