import {
	Card,
	CardBody,
	CardHeader,
	Checkbox,
	Divider,
	Input,
	NumberInput,
	Select,
	SelectItem,
} from "@heroui/react";
import { getBaseNode } from "@impoexpo/shared/nodes/node-database";
import type { ObjectEntry } from "@impoexpo/shared/nodes/node-types";
import {
	Handle,
	type NodeProps,
	Position,
	type BuiltInNode,
} from "@xyflow/react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	type DefaultNodeRenderOptions,
	localizableString,
} from "./nodes/renderable-node-types";
import "@valibot/i18n/ru";
import { useLingui } from "@lingui/react/macro";
import type { BaseIssue } from "valibot";
import useLocaleInformation from "@/hooks/useLocaleInformation";
import { useFormatEditorStore } from "./store";
import clsx from "clsx";
import {
	type ValidatorFunction,
	isPicklist,
	isEnum,
} from "@impoexpo/shared/nodes/node-utils";
import { useRenderableNodesStore } from "./nodes/renderable-node-database";
import useThrottle from "@/hooks/useThrottle";

export default function DefaultNodeRenderer({
	type,
	id,
}: NodeProps<BuiltInNode>) {
	const { t } = useLingui();

	const nodeData = useMemo(() => getBaseNode(type), [type]);
	const [nodeRenderOptions, categoryRenderOptions] = useRenderableNodesStore(
		useShallow((state) => [
			state.nodeRenderOptions.get(type),
			state.categoryRenderOptions.get(nodeData.category),
		]),
	);

	if (nodeRenderOptions === undefined) return <>meow</>;

	return (
		<Card classNames={{ body: "p-0", base: "overflow-visible" }}>
			<CardHeader
				className={clsx(
					"pl-4 flex flex-row gap-2 relative",
					nodeRenderOptions.raw.header ?? categoryRenderOptions?.header,
				)}
			>
				{nodeRenderOptions.raw.icon?.(16) ?? categoryRenderOptions?.icon?.(16)}
				<p className="overflow-hidden overflow-ellipsis max-w-64">
					{nodeRenderOptions.raw.title !== undefined
						? localizableString(nodeRenderOptions.raw.title, t)
						: nodeData.name}
				</p>
			</CardHeader>
			<Divider />
			<CardBody className="flex flex-col py-2 overflow-visible">
				{nodeData.inputSchema &&
					Object.entries(nodeData.inputSchema.entries).map((pair) => (
						<NodePropertyRenderer
							key={pair[0]}
							renderOptions={nodeRenderOptions}
							name={pair[0]}
							property={pair[1]}
							input={true}
							id={id}
						/>
					))}

				{nodeData.outputSchema &&
					Object.entries(nodeData.outputSchema.entries).map((pair) => (
						<NodePropertyRenderer
							key={pair[0]}
							renderOptions={nodeRenderOptions}
							name={pair[0]}
							property={pair[1]}
							input={false}
							id={id}
						/>
					))}
			</CardBody>
		</Card>
	);
}

const getEntryComponent = <TDefault,>(
	renderOptions: DefaultNodeRenderOptions,
	node: string,
	handleName: string,
	entry: ObjectEntry,
	defaultValue?: TDefault,
	validator?: ValidatorFunction,
) => {
	if ("default" in entry) {
		return getEntryComponent(
			renderOptions,
			node,
			handleName,
			entry.wrapped,
			entry.default,
		);
	}
	if ("pipe" in entry && Array.isArray(entry.pipe) && entry.pipe.length > 0) {
		return getEntryComponent(
			renderOptions,
			node,
			handleName,
			entry.pipe[0] as ObjectEntry,
			defaultValue,
			entry["~run"],
		);
	}

	if (entry.type === "string") {
		return (
			<NodePropertyGenericInput
				name={handleName}
				node={node}
				renderOptions={renderOptions}
				default={(defaultValue as string | undefined) ?? ""}
				validator={validator}
			/>
		);
	}

	if (entry.type === "boolean") {
		return (
			<NodePropertyGenericInput
				name={handleName}
				node={node}
				renderOptions={renderOptions}
				default={(defaultValue as boolean | undefined) ?? false}
				validator={validator}
			/>
		);
	}

	if (entry.type === "number") {
		return (
			<NodePropertyGenericInput
				name={handleName}
				node={node}
				renderOptions={renderOptions}
				default={(defaultValue as number | undefined) ?? 0}
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
		const items = options
			.map((key) => renderOptions.options(handleName, key))
			.filter((i) => i !== undefined);

		return (
			<Select
				style={{ minWidth: "10rem" }}
				popoverProps={{ style: { minWidth: "fit-content" } }}
				aria-label={renderOptions.placeholder(handleName)}
				placeholder={renderOptions.placeholder(handleName)}
				className="nodrag"
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
				items={items}
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

function NodePropertyRenderer(props: {
	renderOptions: DefaultNodeRenderOptions;
	property: ObjectEntry;
	name: string;
	input: boolean;
	id: string;
}) {
	const { edges } = useFormatEditorStore();

	const shouldHideEntryComponent = useMemo(() => {
		if (!props.input) return true;
		if (props.renderOptions.input(props.name)?.mode === "dependentOnly")
			return true;
		return edges.some((edge) => {
			return edge.target === props.id && edge.targetHandle === props.name;
		});
	}, [edges, props.id, props.input, props.name, props.renderOptions.input]);

	const isIndependent = useMemo(() => {
		if (!props.input) return false;
		return props.renderOptions.input(props.name)?.mode === "independentOnly";
	}, [props.renderOptions.input, props.input, props.name]);

	const shouldHideLabel = (entry: ObjectEntry) => {
		if ("wrapped" in entry && entry.type === "optional")
			return shouldHideLabel(entry.wrapped);
		if ("options" in entry) return true;
	};

	const entryComponent = useMemo(
		() =>
			getEntryComponent(
				props.renderOptions,
				props.id,
				props.name,
				props.property,
			),
		[props.renderOptions, props.id, props.name, props.property],
	);

	return props.input ? (
		<div key={props.name} className="flex flex-row gap-4 py-2 pr-4">
			<div className="relative flex flex-row items-start gap-4">
				{!shouldHideLabel(props.property) && (
					<div className="flex flex-col items-start gap-1 pl-4">
						<p className="max-w-64 text-start">
							{props.renderOptions.title(props.name)}
						</p>
						<p className="text-foreground-400 text-tiny">
							{props.renderOptions.description(props.name)}
						</p>
					</div>
				)}
				{!isIndependent && (
					<Handle
						type="target"
						id={props.name}
						position={Position.Left}
						style={{
							top: 0,
							transform: "translate(-50%, 75%)",
							left: 0,
							width: 10,
							height: 10,
						}}
					/>
				)}
			</div>
			<div className="flex-grow">
				{!shouldHideEntryComponent && entryComponent}
			</div>
		</div>
	) : (
		<div key={props.name} className="flex flex-row justify-end gap-4 py-2 pl-4">
			<div className="relative flex flex-row items-start gap-4 w-fit">
				{!shouldHideLabel(props.property) && (
					<div className="flex flex-col items-end gap-1 pr-4">
						<p className="max-w-64 text-end">
							{props.renderOptions.title(props.name)}
						</p>
						<p className="text-foreground-400 text-tiny">
							{props.renderOptions.description(props.name)}
						</p>
					</div>
				)}
				<Handle
					type="source"
					id={props.name}
					position={Position.Right}
					style={{
						top: 0,
						transform: "translate(50%, 75%)",
						right: 0,
						width: 10,
						height: 10,
					}}
				/>
			</div>
		</div>
	);
}

function NodePropertyGenericInput<T extends string | number | boolean>(props: {
	renderOptions: DefaultNodeRenderOptions;
	node: string;
	name: string;
	default: T;
	validator?: ValidatorFunction;
}) {
	const { setNodeEntry } = useFormatEditorStore();
	const [value, setValue] = useState<T | undefined>(props.default);
	const throttledValue = useThrottle(value, 500);
	const [issues, setIssues] = useState<BaseIssue<unknown>[]>([]);
	const locale = useLocaleInformation();

	useEffect(() => {
		if (props.validator === undefined || value === undefined) return;

		const validationResult = props.validator(
			{ value: value },
			{ lang: locale.id },
		);
		setIssues(
			validationResult.issues === undefined ? [] : validationResult.issues,
		);
	}, [props.validator, value, locale]);

	useEffect(() => {
		setNodeEntry(props.node, props.name, throttledValue);
	}, [props.name, props.node, setNodeEntry, throttledValue]);

	if (typeof props.default === "boolean") {
		return (
			<Checkbox
				aria-label={props.renderOptions.placeholder(props.name)}
				isSelected={value as boolean | undefined}
				onValueChange={(selected) =>
					(setValue as React.Dispatch<boolean>)(selected)
				}
				className="nodrag"
				isInvalid={issues.length > 0}
			/>
		);
	}

	if (typeof props.default === "string") {
		return (
			<Input
				aria-label={props.renderOptions.placeholder(props.name)}
				placeholder={props.renderOptions.placeholder(props.name)}
				value={value as string | undefined}
				onValueChange={(v: string) => (setValue as React.Dispatch<string>)(v)}
				errorMessage={() => (
					<div className="flex flex-col gap-1">
						{issues.map((issue, idx) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: no other property to use as key
							<p key={idx}>{issue.message}</p>
						))}
					</div>
				)}
				className="nodrag"
				isInvalid={issues.length > 0}
			/>
		);
	}

	if (typeof props.default === "number") {
		return (
			<NumberInput
				aria-label={props.renderOptions.placeholder(props.name)}
				placeholder={props.renderOptions.placeholder(props.name)}
				value={value as number | undefined}
				onValueChange={(v: number) => (setValue as React.Dispatch<number>)(v)}
				errorMessage={() => (
					<div className="flex flex-col gap-1">
						{issues.map((issue, idx) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: no other property to use as key
							<p key={idx}>{issue.message}</p>
						))}
					</div>
				)}
				isInvalid={issues.length > 0}
				/* TODO: for some reason just doing size="md" doesn't work for now */
				classNames={{
					inputWrapper: "h-10 min-h-10 rounded-medium",
					input: "text-small",
					clearButton: "text-large",
				}}
			/>
		);
	}
}
