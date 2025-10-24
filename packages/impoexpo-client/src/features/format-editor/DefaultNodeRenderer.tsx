import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Checkbox,
	DatePicker,
	Divider,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownSection,
	DropdownTrigger,
	Input,
	NumberInput,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectItem,
	SharedSelection,
} from "@heroui/react";
import { getBaseNode } from "@impoexpo/shared/nodes/node-database";
import type { ObjectEntry } from "@impoexpo/shared/nodes/node-types";
import {
	Handle,
	type NodeProps,
	Position,
	type BuiltInNode,
	useConnection,
	useUpdateNodeInternals,
} from "@xyflow/react";
import type React from "react";
import { Key, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	type DefaultNodeRenderOptions,
	localizableString,
} from "./nodes/renderable-node-types";
import "@valibot/i18n/ru";
import { Trans, useLingui } from "@lingui/react/macro";
import { getDefault, type BaseIssue } from "valibot";
import useLocaleInformation from "@/hooks/useLocaleInformation";
import { useFormatEditorStore } from "./stores/store";
import clsx from "clsx";
import {
	type ValidatorFunction,
	isPicklist,
	isEnum,
	isDateTime,
	isArray,
	isGeneric,
	getGenericName,
} from "@impoexpo/shared/nodes/node-utils";
import { useRenderableNodesStore } from "./nodes/renderable-node-database";
import { Icon } from "@iconify/react";
import { DateTime, FixedOffsetZone } from "luxon";
import {
	parseAbsoluteToLocal,
	type ZonedDateTime,
} from "@internationalized/date";
import { useSettingsStore } from "@/stores/settings";
import { useDocumentationModalStore } from "./modals/documentation-modal/store";
import { docs } from "@/api/common";
import {
	getNodeEntryProperty,
	setNodeEntryIndependentValue,
	updateNodeEntryProperty,
} from "./stores/node-entries";
import {
	getDefaultValue,
	schemaFromString,
	schemaToString,
} from "@impoexpo/shared/nodes/schema-string-conversions";

const DefaultNodeRenderer = memo(function DefaultNodeRenderer({
	type,
	id,
}: NodeProps<BuiltInNode>) {
	const { t } = useLingui();

	const updateNodeInternals = useUpdateNodeInternals();
	const connectionInProgress = useConnection((selector) => selector.inProgress);
	// biome-ignore lint/correctness/useExhaustiveDependencies: node internals should update when the connection progress changes
	useEffect(() => {
		updateNodeInternals(id);
	}, [connectionInProgress, id, updateNodeInternals]);

	const nodeData = useMemo(() => getBaseNode(type), [type]);
	const [nodeRenderOptions, categoryRenderOptions] = useMemo(() => {
		const store = useRenderableNodesStore.getState();
		return [
			store.nodeRenderOptions[type],
			store.categoryRenderOptions[nodeData.category],
		];
	}, [nodeData.category, type]);

	const showDocumentationButton = useSettingsStore(
		(selector) => selector.editor.showDocumentationButton,
	);
	const openDocumentationModal = useCallback(() => {
		const hash =
			nodeRenderOptions.raw.documentationHashOverride ?? nodeData.name;
		const base =
			categoryRenderOptions.documentationLink ??
			`/user/nodes/${nodeData.category}`;
		useDocumentationModalStore.getState().open?.(docs(`${base}#${hash}`));
	}, [nodeData, nodeRenderOptions, categoryRenderOptions]);

	return (
		<Card
			className="node"
			classNames={{ body: "p-0", base: "overflow-visible relative" }}
		>
			<CardHeader
				className={clsx(
					"px-4 relative justify-between gap-2",
					nodeRenderOptions.raw.header ?? categoryRenderOptions?.header,
				)}
			>
				<div className="flex flex-row gap-2 items-center">
					{nodeRenderOptions.raw.icon?.(16) ??
						categoryRenderOptions?.icon?.(16)}
					<p className="overflow-hidden overflow-ellipsis max-w-64">
						{nodeRenderOptions.raw.title !== undefined
							? localizableString(nodeRenderOptions.raw.title, t)
							: nodeData.name}
					</p>
				</div>
				{showDocumentationButton ? (
					<Button
						className="cursor-help group"
						size="sm"
						isIconOnly
						onPress={openDocumentationModal}
						startContent={
							<Icon
								className="opacity-50 group-hover:opacity-100 transition-opacity duration-250"
								width={18}
								icon="mdi:help"
							/>
						}
						variant="light"
					/>
				) : null}
			</CardHeader>
			<Divider />
			<CardBody className="flex flex-col py-2 gap-1 overflow-visible">
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

				{nodeData.iterable && (
					<div>
						<Divider />
						<div className="flex flex-row gap-2 p-2 pb-0">
							<Icon className="text-foreground-400" icon="mdi:information" />
							<p className="text-tiny text-foreground-400">
								<Trans>this node is an iterator.</Trans>
							</p>
						</div>
					</div>
				)}
			</CardBody>
		</Card>
	);
});

export default DefaultNodeRenderer;

const getEntryComponent = <TDefault,>(
	renderOptions: DefaultNodeRenderOptions,
	node: string,
	handleName: string,
	entry: ObjectEntry,
	defaultValue?: TDefault,
	validator?: ValidatorFunction,
	customCallbacks?: Partial<{
		generic: (v: unknown) => void;
		select: (v?: string) => void;
		date: (v?: string | null) => void;
	}>,
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

	if (isArray(entry)) {
		return (
			<NodePropertyArrayInput
				name={handleName}
				node={node}
				renderOptions={renderOptions}
				innerType={entry.item}
				property={entry}
			/>
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
				customCallback={customCallbacks?.generic}
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
				customCallback={customCallbacks?.generic}
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
				customCallback={customCallbacks?.generic}
			/>
		);
	}

	if (entry.type === "picklist" || entry.type === "enum")
		return (
			<NodePropertyGenericSelect
				default={defaultValue as string | undefined}
				entry={entry}
				name={handleName}
				node={node}
				renderOptions={renderOptions}
				customCallback={customCallbacks?.select}
			/>
		);

	if (isDateTime(entry)) {
		return (
			<NodePropertyDatePicker
				default={
					defaultValue ? parseAbsoluteToLocal(defaultValue as string) : null
				}
				name={handleName}
				node={node}
				renderOptions={renderOptions}
				customCallback={customCallbacks?.date}
			/>
		);
	}

	return <></>;
};

export const NodePropertyRenderer = memo(function NodePropertyRenderer(props: {
	renderOptions: DefaultNodeRenderOptions;
	property: ObjectEntry;
	name: string;
	input: boolean;
	id: string;
}) {
	const edges = useFormatEditorStore(useShallow((state) => state.edges));

	const separate = useMemo(
		() => props.renderOptions.separate(props.name),
		[props.name, props.renderOptions],
	);

	const alwaysShowTypes = useSettingsStore(
		(selector) => selector.developer.alwaysShowTypes,
	);

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
		<>
			{(separate === "before" || separate === "both") && <Divider />}
			<div key={props.name} className="flex flex-row gap-4 py-2 pr-4">
				<div className="relative flex flex-row items-start gap-4">
					{props.renderOptions.showLabel(props.name) && (
						<div className="flex flex-col items-start gap-1 pl-4 pt-1">
							<p className="max-w-64 text-start leading-none">
								{props.renderOptions.title(props.name)}
								{alwaysShowTypes && (
									<span className="text-foreground-400 text-tiny">
										<br />
										{props.renderOptions.type(props.name)}
									</span>
								)}
							</p>
							<p className="text-foreground-600 text-tiny max-w-36">
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
			{(separate === "after" || separate === "both") && <Divider />}
		</>
	) : (
		<>
			{(separate === "before" || separate === "both") && <Divider />}
			<div
				key={props.name}
				className="flex flex-row justify-end items-center gap-4 py-2 pl-4"
			>
				<div className="relative flex flex-row items-start gap-4 w-fit">
					{!shouldHideLabel(props.property) && (
						<div className="flex flex-col items-end gap-1 pr-4 pt-1">
							<p className="max-w-64 text-end leading-none">
								{props.renderOptions.title(props.name)}
								{alwaysShowTypes && (
									<span className="text-foreground-400 text-tiny">
										<br />
										{props.renderOptions.type(props.name)}
									</span>
								)}
							</p>
							<p className="text-foreground-600 text-end text-tiny max-w-36">
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
			{(separate === "after" || separate === "both") && <Divider />}
		</>
	);
});

function NodePropertyArrayInput(props: {
	node: string;
	name: string;
	renderOptions: DefaultNodeRenderOptions;
	innerType: ObjectEntry;
	property: ObjectEntry;
}) {
	const { t } = useLingui();
	const [isArrayTypeDropdownOpen, setArrayTypeDropdownOpen] = useState(false);
	const [value, setValue] = useState<unknown[]>([]);
	const resolveGenericNodeIndependent = useFormatEditorStore(
		useShallow((selector) => selector.resolveGenericNodeIndependent),
	);

	useEffect(() => {
		const savedValue = getNodeEntryProperty(props.node, props.name, "value");
		if (savedValue) setValue(savedValue as unknown[]);
	}, [props.name, props.node]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: still depends on value!
	useEffect(() => {
		setNodeEntryIndependentValue(props.node, props.name, value);
	}, [props.name, props.node, JSON.stringify(value)]);

	const saveArrayType = useCallback(
		(key: Key) => {
			if (!isGeneric(props.innerType)) return;
			const schema = schemaFromString(key.toString());
			resolveGenericNodeIndependent(
				props.node,
				getGenericName(props.innerType),
				schema,
			);
			setValue([getDefaultValue(schema)]);
		},
		[resolveGenericNodeIndependent, props.innerType, props.node],
	);

	return (
		<Dropdown
			isOpen={isArrayTypeDropdownOpen}
			onOpenChange={(open) => {
				if (isGeneric(props.innerType)) setArrayTypeDropdownOpen(open);
			}}
		>
			<DropdownTrigger>
				<Card
					onPress={
						value.length === 0
							? () => {
									if (!isGeneric(props.innerType))
										setValue([getDefaultValue(props.innerType)]);
								}
							: undefined
					}
					className="w-full bg-content2"
					isPressable={value.length === 0}
				>
					<CardBody className="flex flex-col justify-center items-center">
						{value.length === 0 ? (
							<Icon className="scale-150" icon="mdi:plus" />
						) : (
							<>meow</>
						)}
					</CardBody>
				</Card>
			</DropdownTrigger>
			<DropdownMenu onAction={saveArrayType}>
				<DropdownSection title={t`what do you wish to store?`}>
					<DropdownItem
						key="string"
						startContent={<Icon width={18} icon="mdi:text" />}
					>
						<Trans>strings</Trans>
					</DropdownItem>
					<DropdownItem
						key="number"
						startContent={<Icon width={18} icon="mdi:plus-minus-variant" />}
					>
						<Trans>numbers</Trans>
					</DropdownItem>
					<DropdownItem
						key="DateTime"
						startContent={<Icon width={18} icon="mdi:calendar" />}
					>
						<Trans>dates</Trans>
					</DropdownItem>
					<DropdownItem
						key="boolean"
						startContent={<Icon width={18} icon="mdi:check" />}
					>
						<Trans>flags</Trans>
					</DropdownItem>
				</DropdownSection>
			</DropdownMenu>
		</Dropdown>
	);
}

function NodePropertyDatePicker(props: {
	node: string;
	name: string;
	renderOptions: DefaultNodeRenderOptions;
	default: ZonedDateTime | null;
	customCallback?: (v?: string | null) => void;
}) {
	const [value, setValue] = useState<ZonedDateTime | null>(props.default);

	useEffect(() => {
		const savedValue = getNodeEntryProperty(props.node, props.name, "value");
		if (savedValue) setValue(parseAbsoluteToLocal(savedValue as string));
	}, [props.name, props.node]);

	useEffect(() => {
		const date = value
			? DateTime.fromObject(
					{
						year: value.year,
						day: value.day,
						month: value.month,
					},
					{ zone: FixedOffsetZone.utcInstance },
				).toJSON()
			: undefined;
		props.customCallback
			? props.customCallback(date)
			: setNodeEntryIndependentValue(props.node, props.name, date);
	}, [props.customCallback, props.name, props.node, value]);

	return (
		<DatePicker
			style={{ minWidth: "15rem" }}
			popoverProps={{ className: "min-w-fit" }}
			aria-label={props.renderOptions.placeholder(props.name)}
			className="nodrag"
			value={value}
			onChange={setValue}
		/>
	);
}

function NodePropertyGenericSelect(props: {
	renderOptions: DefaultNodeRenderOptions;
	node: string;
	name: string;
	default: string | undefined;
	entry: ObjectEntry;
	customCallback?: (v?: string) => void;
}) {
	const options = useMemo(
		() =>
			isPicklist(props.entry)
				? props.entry.options
				: isEnum(props.entry)
					? Object.keys(props.entry.enum)
					: [],
		[props.entry],
	);

	const items = useMemo(
		() =>
			options
				.map((key) => props.renderOptions.options(props.name, key))
				.filter((i) => i !== undefined),
		[props.renderOptions, props.name, options],
	);

	const [value, setValue] = useState<string | undefined>(props.default);

	useEffect(() => {
		const savedValue = getNodeEntryProperty(props.node, props.name, "value");
		if (savedValue) setValue(savedValue as string);
	}, [props.name, props.node]);

	useEffect(() => {
		props.customCallback
			? props.customCallback(value)
			: setNodeEntryIndependentValue(props.node, props.name, value);
	}, [props.customCallback, props.name, props.node, value]);

	return (
		<Select
			style={{ minWidth: "15rem" }}
			popoverProps={{ className: "min-w-fit" }}
			aria-label={props.renderOptions.placeholder(props.name)}
			placeholder={props.renderOptions.placeholder(props.name)}
			className="nodrag"
			onSelectionChange={(selection) => {
				if (selection.currentKey)
					setNodeEntryIndependentValue(
						props.node,
						props.name,
						selection.currentKey,
					);
			}}
			onChange={(ev) => {
				setValue(ev.target.value);
			}}
			selectedKeys={value ? [value] : []}
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

function NodePropertyGenericInput<T extends string | number | boolean>(props: {
	renderOptions: DefaultNodeRenderOptions;
	node: string;
	name: string;
	default: T;
	validator?: ValidatorFunction;
	customCallback?: (v: unknown) => void;
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

	useEffect(() => {
		const savedValue = getNodeEntryProperty(props.node, props.name, "value");
		if (savedValue) setValue(savedValue as T);
	}, [props.name, props.node]);

	useEffect(() => {
		props.customCallback
			? props.customCallback(value)
			: setNodeEntryIndependentValue(props.node, props.name, value);
	}, [props.customCallback, props.name, props.node, value]);

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
