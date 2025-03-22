import {
	Card,
	CardBody,
	CardHeader,
	Divider,
	Input,
	Select,
	SelectItem,
} from "@heroui/react";
import { type AllowedObjectEntry, baseNodesMap } from "@impoexpo/shared";
import { type NodeProps, type Node, Position, Handle } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import { useRenderableNodesStore } from "./nodes/renderable-node-types";
import { useShallow } from "zustand/react/shallow";
import {
	extractOptionMetadata,
	extractPropertyPlaceholder,
	extractPropertyTitle,
	isEnum,
	isPicklist,
	type ValidatorFunction,
} from "./nodes/node-schema-helpers";
import "@valibot/i18n/ru";
import type { BaseIssue } from "valibot";

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

	const getEntryComponent = <TDefault,>(
		entry: AllowedObjectEntry,
		defaultValue?: TDefault,
		validator?: ValidatorFunction,
	) => {
		if ("default" in entry) {
			return getEntryComponent(entry.wrapped, entry.default);
		}
		if ("pipe" in entry && Array.isArray(entry.pipe) && entry.pipe.length > 0) {
			return getEntryComponent(
				entry.pipe[0] as AllowedObjectEntry,
				undefined,
				entry["~run"],
			);
		}

		if (entry.type === "string") {
			return (
				<NodePropertyStringInput
					name={props.name}
					type={props.type}
					default={defaultValue as string | undefined}
					validator={validator}
				/>
			);
		}

		if (entry.type === "picklist" || entry.type === "enum") {
			const options = isPicklist(entry)
				? entry.options
				: isEnum(entry)
					? Object.keys(entry.enum)
					: [];
			const items = options.map((key) =>
				extractOptionMetadata(props.type, props.name, key),
			);

			return (
				<Select
					size="sm"
					style={{ minWidth: "10rem" }}
					classNames={{ popoverContent: "w-max" }}
					aria-label={extractPropertyPlaceholder(props.type, props.name)}
					placeholder={extractPropertyPlaceholder(props.type, props.name)}
					defaultSelectedKeys={
						defaultValue === undefined
							? undefined
							: new Set<string>().add(
									typeof defaultValue === "string"
										? defaultValue
										: // biome-ignore lint/style/noNonNullAssertion: meow
											defaultValue!.toString(),
								)
					}
					items={items.filter((i) => i !== undefined)}
				>
					{(data) => (
						<SelectItem
							aria-label={data.description ?? data.title ?? data.key}
							description={data.description}
							key={data.key}
						>
							{data.title}
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
				<p>{extractPropertyTitle(props.type, props.name)}</p>
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

function NodePropertyStringInput(props: {
	type: string;
	name: string;
	default?: string;
	validator?: ValidatorFunction;
}) {
	const [value, setValue] = useState<string>(props.default ?? "");
	const [issues, setIssues] = useState<BaseIssue<unknown>[]>([]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: props.validator does not change
	useEffect(() => {
		if (props.validator === undefined) return;
		if (value === "") {
			setIssues([]);
			return;
		}

		const validationResult = props.validator({ value: value }, { lang: "ru" });
		setIssues(
			validationResult.issues === undefined ? [] : validationResult.issues,
		);
	}, [value]);

	return (
		<Input
			aria-label={extractPropertyPlaceholder(props.type, props.name)}
			placeholder={extractPropertyPlaceholder(props.type, props.name)}
			value={value}
			onValueChange={setValue}
			errorMessage={() => (
				<div className="flex flex-col gap-1">
					{issues.map((issue, idx) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: no other property to use as key
						<p key={idx}>{issue.message}</p>
					))}
				</div>
			)}
			isInvalid={issues.length > 0}
			size="sm"
		/>
	);
}
