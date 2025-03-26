import {
	Card,
	CardBody,
	CardHeader,
	Divider,
	Input,
	NumberInput,
	Select,
	SelectItem,
} from "@heroui/react";
import type { AllowedObjectEntry } from "@impoexpo/shared/nodes/node-types";
import { baseNodesMap } from "@impoexpo/shared/nodes/node-database";
import { type NodeProps, type Node, Position, Handle } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import {
	FLOW_IN_HANDLE_ID,
	FLOW_OUT_HANDLE_ID,
	useRenderableNodesStore,
} from "./nodes/renderable-node-types";
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
			<CardHeader className="pl-4 flex flex-row gap-2 relative">
				{nodeData.flowConnectable && (
					<Handle
						type="target"
						id={FLOW_IN_HANDLE_ID}
						position={Position.Left}
						style={{
							borderRadius: 0,
							clipPath: "polygon(0 50%, 100% 0, 100% 100%)",
							left: 0,
							width: 10,
							height: 10,
						}}
					/>
				)}
				{categoryIcon?.(16)}
				<p>{nodeRenderOptions.title ?? nodeData.name}</p>
				{nodeData.flowConnectable && (
					<Handle
						type="source"
						id={FLOW_OUT_HANDLE_ID}
						position={Position.Right}
						style={{
							borderRadius: 0,
							clipPath: "polygon(0 0, 100% 50%, 0 100%)",
							right: 0,
							width: 10,
							height: 10,
						}}
					/>
				)}
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

				{nodeData.outputSchema &&
					Object.entries(nodeData.outputSchema.entries).map((pair) => (
						<NodePropertyRenderer
							key={pair[0]}
							type={type}
							name={pair[0]}
							property={pair[1]}
							input={false}
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
		useShallow((state) => [state.nodeRenderOptions.get(props.type)!]),
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
				defaultValue,
				entry["~run"],
			);
		}

		if (entry.type === "string") {
			return (
				<NodePropertyGenericInput
					name={props.name}
					type={props.type}
					default={(defaultValue as string | undefined) ?? ""}
					validator={validator}
				/>
			);
		}

		if (entry.type === "number") {
			return (
				<NodePropertyGenericInput
					name={props.name}
					type={props.type}
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
				extractOptionMetadata(props.type, props.name, key),
			);

			return (
				<Select
					style={{ minWidth: "10rem" }}
					popoverProps={{ triggerScaleOnOpen: true }}
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

	return props.input ? (
		<div key={props.name} className="flex flex-row gap-4 py-2 pr-4">
			<div className="relative flex flex-row gap-4 items-start">
				{!shouldHideLabel(props.property) && (
					<p className="pl-4">{extractPropertyTitle(props.type, props.name)}</p>
				)}
				{!nodeData.independentInputs.includes(props.name) && (
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
			{getEntryComponent(props.property)}
		</div>
	) : (
		<div key={props.name} className="flex flex-row justify-end gap-4 py-2 pl-4">
			<div className="relative flex flex-row gap-4 items-start">
				{!shouldHideLabel(props.property) && (
					<p className="pr-4">{extractPropertyTitle(props.type, props.name)}</p>
				)}
				{!nodeData.independentInputs.includes(props.name) && (
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
				)}
			</div>
		</div>
	);
}

function NodePropertyGenericInput<T extends string | number>(props: {
	type: string;
	name: string;
	default: T;
	validator?: ValidatorFunction;
}) {
	const [value, setValue] = useState<T | undefined>(props.default);
	const [issues, setIssues] = useState<BaseIssue<unknown>[]>([]);

	useEffect(() => {
		if (props.validator === undefined || value === undefined) return;

		const validationResult = props.validator({ value: value }, { lang: "en" });
		setIssues(
			validationResult.issues === undefined ? [] : validationResult.issues,
		);
	}, [props.validator, value]);

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
