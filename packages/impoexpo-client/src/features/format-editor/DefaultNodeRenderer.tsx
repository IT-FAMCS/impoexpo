import type { NodeProps, Node } from "@xyflow/react";

export default function DefaultNodeRenderer<
	TIn extends Record<string, unknown>,
	TType extends string,
>({ data }: NodeProps<Node<TIn, TType>>) {
	return <></>;
}
