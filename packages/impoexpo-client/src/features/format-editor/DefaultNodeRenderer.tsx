import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { baseNodesMap } from "@impoexpo/shared";
import { type NodeProps, type Node, Position, Handle } from "@xyflow/react";
import { useMemo } from "react";
import { useRenderableNodesStore } from "./nodes/renderable-node-types";
import { useShallow } from "zustand/react/shallow";

export default function DefaultNodeRenderer<
	TIn extends Record<string, unknown>,
	TType extends string,
>({ type }: NodeProps<Node<TIn, TType>>) {
	// biome-ignore lint/style/noNonNullAssertion: testing
	const nodeData = useMemo(() => baseNodesMap.get(type)!, [type]);
	const [nodeRenderOptions, categoryIcon] = useRenderableNodesStore(
		useShallow((state) => [
			state.nodeRenderOptionsMap.get(type),
			state.nodeRenderOptionsMap.get(type)?.categoryIcon ??
				(state.categoryIconRenderers.has(nodeData.category)
					? state.categoryIconRenderers.get(nodeData.category)
					: null),
		]),
	);

	console.log(nodeData);
	if (nodeRenderOptions === undefined) return <>meow</>;

	return (
		<Card classNames={{ body: "p-0", base: "overflow-visible" }}>
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
								style={{ left: 0, width: 10, height: 10 }}
							/>
						</div>
					))}
			</CardBody>
		</Card>
	);
}
