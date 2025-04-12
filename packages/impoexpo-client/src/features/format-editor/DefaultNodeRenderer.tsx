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
import { baseNodesMap } from "@impoexpo/shared/nodes/node-database";
import type { AllowedObjectEntry } from "@impoexpo/shared/nodes/node-types";
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
	extractOptionMetadata,
	extractPropertyDescription,
	extractPropertyPlaceholder,
	extractPropertyTitle,
} from "./nodes/node-schema-helpers";
import {
	localizableString,
	useRenderableNodesStore,
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

export default function DefaultNodeRenderer({
	type,
	id,
}: NodeProps<BuiltInNode>) {
	const { t } = useLingui();

	// biome-ignore lint/style/noNonNullAssertion: only registered nodes get renderered
	const nodeData = useMemo(() => baseNodesMap.get(type)!, [type]);
	const [nodeRenderOptions, categoryIcon] = useRenderableNodesStore(
		useShallow((state) => [
			state.nodeRenderOptions.get(type),
			state.nodeRenderOptions.get(type)?.categoryIcon ??
				(state.categoryRenderOptions.has(nodeData.category)
					? state.categoryRenderOptions.get(nodeData.category)?.icon
					: null),
		]),
	);

	if (nodeRenderOptions === undefined) return <>meow</>;

	return (
		<Card classNames={{ body: "p-0", base: "overflow-visible" }}>
			<CardHeader
				className={clsx(
					"pl-4 flex flex-row gap-2 relative",
					nodeRenderOptions.headerColor,
				)}
			>
				{categoryIcon?.(16)}
				<p>
					{nodeRenderOptions.title !== undefined
						? localizableString(nodeRenderOptions.title, t)
						: nodeData.name}
				</p>
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
							id={id}
						/>
					))}

				{nodeData.outputSchema &&
					Object.entries(nodeData.outputSchema.entries).map((pair) => (
						<NodePropertyRenderer
							key={pair[0]}
							type={type}
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
	nodeType: string,
	handleName: string,
	entry: AllowedObjectEntry,
	defaultValue?: TDefault,
	validator?: ValidatorFunction,
) => {
	if ("default" in entry) {
		return getEntryComponent(
			nodeType,
			handleName,
			entry.wrapped,
			entry.default,
		);
	}
	if ("pipe" in entry && Array.isArray(entry.pipe) && entry.pipe.length > 0) {
		return getEntryComponent(
			nodeType,
			handleName,
			entry.pipe[0] as AllowedObjectEntry,
			defaultValue,
			entry["~run"],
		);
	}

	if (entry.type === "string") {
		return (
			<NodePropertyGenericInput
				name={handleName}
				type={nodeType}
				default={(defaultValue as string | undefined) ?? ""}
				validator={validator}
			/>
		);
	}

	if (entry.type === "boolean") {
		return (
			<NodePropertyGenericInput
				name={handleName}
				type={nodeType}
				default={(defaultValue as boolean | undefined) ?? false}
				validator={validator}
			/>
		);
	}

	if (entry.type === "number") {
		return (
			<NodePropertyGenericInput
				name={handleName}
				type={nodeType}
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
		const items = options.map((key) =>
			extractOptionMetadata(nodeType, handleName, key),
		);

		return (
			<Select
				style={{ minWidth: "10rem" }}
				popoverProps={{ style: { minWidth: "fit-content" } }}
				aria-label={extractPropertyPlaceholder(nodeType, handleName)}
				placeholder={extractPropertyPlaceholder(nodeType, handleName)}
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

function NodePropertyRenderer(props: {
	type: string;
	property: AllowedObjectEntry;
	name: string;
	input: boolean;
	id: string;
}) {
	const [nodeRenderOptions] = useRenderableNodesStore(
		// biome-ignore lint/style/noNonNullAssertion: only registered nodes get rendered
		useShallow((state) => [state.nodeRenderOptions.get(props.type)!]),
	);
	const { edges } = useFormatEditorStore();

	const shouldHideEntryComponent = useMemo(() => {
		if (!props.input) return true;
		if (nodeRenderOptions.inputs?.[props.name]?.mode === "dependentOnly")
			return true;
		return edges.some((edge) => {
			return edge.target === props.id && edge.targetHandle === props.name;
		});
	}, [edges, props.id, props.input, props.name, nodeRenderOptions]);

	const isIndependent = useMemo(() => {
		if (!props.input) return false;
		return nodeRenderOptions.inputs?.[props.name]?.mode === "independentOnly";
	}, [nodeRenderOptions, props.input, props.name]);

	const shouldHideLabel = (entry: AllowedObjectEntry) => {
		if ("wrapped" in entry && entry.type === "optional")
			return shouldHideLabel(entry.wrapped);
		if ("options" in entry) return true;
	};

	const entryComponent = useMemo(
		() => getEntryComponent(props.type, props.name, props.property),
		[props.type, props.name, props.property],
	);

	return props.input ? (
		<div key={props.name} className="flex flex-row gap-4 py-2 pr-4">
			<div className="relative flex flex-row items-start gap-4">
				{!shouldHideLabel(props.property) && (
					<div className="flex flex-col items-start gap-1 pl-4">
						<p className="max-w-64 text-start">
							{extractPropertyTitle(props.type, props.name)}
						</p>
						<p className="text-foreground-400 text-tiny">
							{extractPropertyDescription(props.type, props.name)}
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
			{!shouldHideEntryComponent && entryComponent}
		</div>
	) : (
		<div key={props.name} className="flex flex-row justify-end gap-4 py-2 pl-4">
			<div className="relative flex flex-row items-start gap-4">
				{!shouldHideLabel(props.property) && (
					<div className="flex flex-col items-end gap-1 pr-4">
						<p className="max-w-64 text-end">
							{extractPropertyTitle(props.type, props.name)}
						</p>
						<p className="text-foreground-400 text-tiny">
							{extractPropertyDescription(props.type, props.name)}
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
	type: string;
	name: string;
	default: T;
	validator?: ValidatorFunction;
}) {
	const [value, setValue] = useState<T | undefined>(props.default);
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

	if (typeof props.default === "boolean") {
		return (
			<Checkbox
				aria-label={extractPropertyPlaceholder(props.type, props.name)}
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
				aria-label={extractPropertyPlaceholder(props.type, props.name)}
				placeholder={extractPropertyPlaceholder(props.type, props.name)}
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
				aria-label={extractPropertyPlaceholder(props.type, props.name)}
				placeholder={extractPropertyPlaceholder(props.type, props.name)}
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
