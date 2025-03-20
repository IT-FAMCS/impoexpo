import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { baseNodesMap } from "@impoexpo/shared";
import { type NodeProps, type Node, Position, Handle } from "@xyflow/react";
import { useMemo } from "react";
import { categoryIconRenderers } from "./nodes/renderable-node-types";

export default function DefaultNodeRenderer<
	TIn extends Record<string, unknown>,
	TType extends string,
>({ type }: NodeProps<Node<TIn, TType>>) {
	// biome-ignore lint/style/noNonNullAssertion: only registered nodes can be renderered
	const nodeData = useMemo(() => baseNodesMap.get(type)!, [type]);

	return (
		<Card classNames={{ body: "p-0" }}>
			<CardHeader className="flex flex-row gap-2">
				{categoryIconRenderers.has(nodeData.category) &&
					categoryIconRenderers.get(nodeData.category)}
				<p>{nodeData.name}</p>
			</CardHeader>
			<Divider />
			<CardBody>
				{nodeData.inputSchema &&
					Object.keys(nodeData.inputSchema.entries).map((name, idx) => (
						<p key={idx}>{name}</p>
					))}
			</CardBody>
		</Card>
	);
}
