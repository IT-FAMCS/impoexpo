import {
	Card,
	CardBody,
	CardHeader,
	Divider,
	Select,
	SelectItem,
} from "@heroui/react";
import { type AllowedObjectEntry, baseNodesMap } from "@impoexpo/shared";
import { type NodeProps, type Node, Position, Handle } from "@xyflow/react";
import { useMemo } from "react";
import {
	NodePropertyMetadata,
	useRenderableNodesStore,
} from "./nodes/renderable-node-types";
import { useShallow } from "zustand/react/shallow";
import { OptionalSchema, PicklistSchema } from "valibot";

export default function DefaultNodeRenderer<
	TIn extends Record<string, unknown>,
	TType extends string,
>({ type }: NodeProps<Node<TIn, TType>>) {
	// biome-ignore lint/style/noNonNullAssertion: only registered nodes get renderered
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
					Object.entries(nodeData.inputSchema.entries).map((pair) => (
						<NodePropertyRenderer
							key={pair[0]}
							type={type}
							name={pair[0]}
							property={pair[1]}
							input={true}
						/>
					))}
			</CardBody>
		</Card>
	);
}

function NodePropertyRenderer(props: {
	type: string;
	property: AllowedObjectEntry;
	name: string;
	input: boolean;
}) {
	// biome-ignore lint/style/noNonNullAssertion: only registered nodes get renderered
	const nodeData = useMemo(() => baseNodesMap.get(props.type)!, [props.type]);
	const [nodeRenderOptions] = useRenderableNodesStore(
		// biome-ignore lint/style/noNonNullAssertion: only registered nodes get rendered
		useShallow((state) => [state.nodeRenderOptionsMap.get(props.type)!]),
	);

	const shouldHideLabel = (entry: AllowedObjectEntry) => {
		if ("wrapped" in entry && entry.type === "optional")
			return shouldHideLabel(entry.wrapped);
		if ("options" in entry) return true;
	};

	const getEntryComponent = <T,>(
		entry: AllowedObjectEntry,
		defaultValue?: T,
	) => {
		if ("default" in entry) {
			return getEntryComponent(entry.wrapped, entry.default);
		}

		if (
			"options" in entry &&
			(entry.type === "picklist" || entry.type === "enum") &&
			Array.isArray(entry.options)
		) {
			// TODO: refactor this
			// @ts-ignore
			const items = (
				entry.type === "picklist" ? entry.options : Object.keys(entry.enum)
			).map((key) => {
				if (
					nodeData.inputSchema === undefined ||
					nodeRenderOptions.properties === undefined ||
					!(props.name in nodeRenderOptions.properties)
				)
					return null;
				// biome-ignore lint/style/noNonNullAssertion: guaranteed to exist
				const property = nodeRenderOptions.properties[props.name]!;
				if (!("options" in property)) return null;
				const options = property.options as Record<
					string,
					Partial<{ title: string; description: string }>
				>;
				if (!(key in options)) return null;

				// biome-ignore lint/style/noNonNullAssertion: checked above
				const data = options[key]!;
				const keyString = key.toString();
				return {
					key: keyString,
					label: data.title ?? keyString,
					description: data.description ?? null,
				};
			});

			return (
				<Select
					size="sm"
					style={{ minWidth: "10rem" }}
					classNames={{ popoverContent: "w-max" }}
					defaultSelectedKeys={
						defaultValue === undefined
							? undefined
							: // biome-ignore lint/style/noNonNullAssertion: meow
								new Set(defaultValue!.toString())
					}
					items={items.filter((i) => i !== null)}
				>
					{(data) => (
						<SelectItem description={data.description} key={data.key}>
							{data.label}
						</SelectItem>
					)}
				</Select>
			);
		}
		return <></>;
	};

	return (
		<div key={props.name} className="relative flex flex-row gap-4 px-4 py-2">
			{!shouldHideLabel(props.property) && (
				<p>
					{Object.keys(nodeRenderOptions.properties ?? {}).includes(props.name)
						? // biome-ignore lint/style/noNonNullAssertion: verified above
							nodeRenderOptions.properties![props.name]?.title
						: props.name}
				</p>
			)}
			{getEntryComponent(props.property)}

			{!nodeData.independentInputs.includes(props.name) && (
				<Handle
					type="target"
					position={Position.Left}
					style={{ left: 0, width: 10, height: 10 }}
				/>
			)}
		</div>
	);
}
