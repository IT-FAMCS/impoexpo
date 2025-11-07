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
	useConnection,
	useUpdateNodeInternals,
} from "@xyflow/react";
import type React from "react";
import {
	createContext,
	type Key,
	useContext,
	useEffect,
	useState,
} from "react";
import { useShallow } from "zustand/react/shallow";
import {
	type DefaultNodeRenderOptions,
	localizableString,
} from "./nodes/renderable-node-types";
import "@valibot/i18n/ru";
import { Trans, useLingui } from "@lingui/react/macro";
import type { BaseIssue } from "valibot";
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
	parseZonedDateTime,
	type ZonedDateTime,
} from "@internationalized/date";
import { useSettingsStore } from "@/stores/settings";
import { useDocumentationModalStore } from "./modals/documentation-modal/store";
import { docs } from "@/api/common";
import {
	getNodeEntryProperty,
	setNodeEntryIndependentValue,
} from "./stores/node-entries";
import {
	getDefaultValue,
	schemaFromString,
} from "@impoexpo/shared/nodes/schema-string-conversions";
import { Reorder, useDragControls } from "motion/react";
import { v4 } from "uuid";
import { dateTimeFromAny } from "luxon-parser";

const NodeIndependentPropertyContext = createContext<
	| {
			node: string;
			handle: string;
			schema: ObjectEntry;
			renderOptions: DefaultNodeRenderOptions;

			default?: unknown;
			validator?: ValidatorFunction;

			override?: {
				getter: () => unknown;
				setter: (v: unknown) => void;
			};
	  }
	| undefined
>(undefined);

export default function DefaultNodeRenderer({
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

	const nodeData = getBaseNode(type);
	const [nodeRenderOptions, categoryRenderOptions] = [
		useRenderableNodesStore.getState().nodeRenderOptions[type],
		useRenderableNodesStore.getState().categoryRenderOptions[nodeData.category],
	];

	const showDocumentationButton = useSettingsStore(
		(selector) => selector.editor.showDocumentationButton,
	);
	const openDocumentationModal = () => {
		const hash =
			nodeRenderOptions.raw.documentationHashOverride ?? nodeData.name;
		const base =
			categoryRenderOptions.documentationLink ??
			`/user/nodes/${nodeData.category}`;
		useDocumentationModalStore.getState().open?.(docs(`${base}#${hash}`));
	};

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
				<div className="flex flex-row items-center gap-2">
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
								className="transition-opacity opacity-50 group-hover:opacity-100 duration-250"
								width={18}
								icon="mdi:help"
							/>
						}
						variant="light"
					/>
				) : null}
			</CardHeader>
			<Divider />
			<CardBody className="flex flex-col gap-1 py-2 overflow-visible">
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
}

function NodeIndependentPropertyInput() {
	const ctx = useContext(NodeIndependentPropertyContext);
	if (!ctx)
		throw new Error(
			"cannot render NodeIndependentPropertyInput without NodeEntryRendererContext",
		);

	if ("default" in ctx.schema) {
		return (
			<NodeIndependentPropertyContext
				value={{
					...ctx,
					schema: ctx.schema.wrapped,
					default: ctx.schema.default,
				}}
			>
				<NodeIndependentPropertyInput />
			</NodeIndependentPropertyContext>
		);
	}

	if (
		"pipe" in ctx.schema &&
		Array.isArray(ctx.schema.pipe) &&
		ctx.schema.pipe.length > 0
	) {
		return (
			<NodeIndependentPropertyContext
				value={{
					...ctx,
					schema: ctx.schema.pipe[0],
					validator: ctx.schema["~run"],
				}}
			>
				<NodeIndependentPropertyInput />
			</NodeIndependentPropertyContext>
		);
	}

	if (isArray(ctx.schema))
		return <NodePropertyArrayInput innerType={ctx.schema.item} />;

	if (ctx.schema.type === "string") return <NodePropertyGenericInput<string> />;
	if (ctx.schema.type === "boolean")
		return <NodePropertyGenericInput<boolean> />;
	if (ctx.schema.type === "number") return <NodePropertyGenericInput<number> />;

	if (ctx.schema.type === "picklist" || ctx.schema.type === "enum")
		return <NodePropertyGenericSelect />;

	if (isDateTime(ctx.schema)) return <NodePropertyDatePicker />;

	return <></>;
}

function NodePropertyRenderer(props: {
	renderOptions: DefaultNodeRenderOptions;
	property: ObjectEntry;
	name: string;
	input: boolean;
	id: string;
}) {
	const edges = useFormatEditorStore(useShallow((state) => state.edges));

	const separate = props.renderOptions.separate(props.name);
	const alwaysShowTypes = useSettingsStore(
		(selector) => selector.developer.alwaysShowTypes,
	);

	const shouldHideEntryComponent = () => {
		if (!props.input) return true;
		if (props.renderOptions.input(props.name)?.mode === "dependentOnly")
			return true;
		return edges.some((edge) => {
			return edge.target === props.id && edge.targetHandle === props.name;
		});
	};

	const isIndependent = () => {
		if (!props.input) return false;
		return props.renderOptions.input(props.name)?.mode === "independentOnly";
	};

	const shouldHideLabel = (entry: ObjectEntry) => {
		if ("wrapped" in entry && entry.type === "optional")
			return shouldHideLabel(entry.wrapped);
		if ("options" in entry) return true;
	};

	const context = {
		node: props.id,
		handle: props.name,
		renderOptions: props.renderOptions,
		schema: props.property,
		default: getDefaultValue(props.property),
	};

	return props.input ? (
		<>
			{(separate === "before" || separate === "both") && <Divider />}
			<div key={props.name} className="flex flex-row gap-4 py-2 pr-4">
				<div className="relative flex flex-row items-start gap-4">
					{props.renderOptions.showLabel(props.name) && (
						<div className="flex flex-col items-start gap-1 pt-1 pl-4">
							<p className="leading-none max-w-64 text-start">
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
					{!isIndependent() && (
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
					{!shouldHideEntryComponent() && (
						<NodeIndependentPropertyContext value={context}>
							<NodeIndependentPropertyInput />
						</NodeIndependentPropertyContext>
					)}
				</div>
			</div>
			{(separate === "after" || separate === "both") && <Divider />}
		</>
	) : (
		<>
			{(separate === "before" || separate === "both") && <Divider />}
			<div
				key={props.name}
				className="flex flex-row items-center justify-end gap-4 py-2 pl-4"
			>
				<div className="relative flex flex-row items-start gap-4 w-fit">
					{!shouldHideLabel(props.property) && (
						<div className="flex flex-col items-end gap-1 pt-1 pr-4">
							<p className="leading-none max-w-64 text-end">
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
}

// sigh
class WrappedValue {
	id: string;
	value: unknown;

	constructor(v: unknown, id?: string) {
		this.value = v;
		this.id = id ?? v4();
	}
}

function NodePropertyArrayInputItem(props: {
	value: WrappedValue;
	innerType: ObjectEntry;
	values: WrappedValue[];
	setValue: (v: WrappedValue[]) => void;
}) {
	const controls = useDragControls();
	const ctx = useContext(NodeIndependentPropertyContext);
	if (!ctx)
		throw new Error(
			"cannot render NodePropertyArrayInputItem without a NodeIndependentPropertyContext",
		);
	return (
		<Reorder.Item
			dragListener={false}
			dragControls={controls}
			value={props.value}
		>
			<NodeIndependentPropertyContext
				value={{
					...ctx,
					schema: props.innerType,
					default: getDefaultValue(props.innerType),
					override: {
						getter: () => props.value.value,
						setter: (newValue) => {
							if (props.value.value === newValue) return;
							props.setValue(
								props.values.map((it) =>
									it.id === props.value.id
										? new WrappedValue(newValue, props.value.id)
										: it,
								),
							);
						},
					},
				}}
			>
				<div className="flex flex-row items-center justify-center w-full gap-1">
					<div
						onPointerDown={(e) => controls.start(e)}
						className="flex items-center justify-center h-full mr-1 reorder-handle"
					>
						<Icon icon="mdi:drag-horizontal" />
					</div>
					<NodeIndependentPropertyInput />
					<Button
						onPress={() => {
							props.setValue(
								props.values.filter((it) => it.id !== props.value.id),
							);
						}}
						color="danger"
						variant="light"
						startContent={<Icon className="scale-125" icon="mdi:delete" />}
						isIconOnly
					/>
				</div>
			</NodeIndependentPropertyContext>
		</Reorder.Item>
	);
}

function NodePropertyArrayInput(props: { innerType: ObjectEntry }) {
	const ctx = useContext(NodeIndependentPropertyContext);
	if (!ctx)
		throw new Error(
			"cannot render NodePropertyArrayInput without a NodeIndependentPropertyContext",
		);
	const { t } = useLingui();
	const [isArrayTypeDropdownOpen, setArrayTypeDropdownOpen] = useState(false);
	const [value, setValue] = useState<WrappedValue[]>(
		(
			(ctx.override?.getter
				? ctx.override.getter()
				: (getNodeEntryProperty(ctx.node, ctx.handle, "value") ??
					ctx.default ??
					[])) as unknown[]
		).map((v) => new WrappedValue(v)),
	);

	const resolveGenericNodeIndependent = useFormatEditorStore(
		useShallow((selector) => selector.resolveGenericNodeIndependent),
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: still depends on value!
	useEffect(() => {
		ctx.override?.setter
			? ctx.override.setter(value.map((v) => v.value))
			: setNodeEntryIndependentValue(
					ctx.node,
					ctx.handle,
					value.map((v) => v.value),
				);
	}, [ctx.override, ctx.handle, ctx.node, JSON.stringify(value)]);

	const saveArrayType = (key: Key) => {
		if (!isGeneric(props.innerType)) return;
		const schema = schemaFromString(key.toString());
		resolveGenericNodeIndependent(
			ctx.node,
			getGenericName(props.innerType),
			schema,
		);
		setValue([new WrappedValue(getDefaultValue(schema))]);
	};

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
										setValue([
											new WrappedValue(getDefaultValue(props.innerType)),
										]);
								}
							: undefined
					}
					className={clsx(
						"w-full nodrag",
						value.length === 0 ? "bg-content2" : "bg-content1",
					)}
					isPressable={value.length === 0}
				>
					<CardBody className="flex flex-col items-center justify-center">
						{value.length === 0 ? (
							<Icon className="scale-150" icon="mdi:plus" />
						) : (
							<div className="flex flex-col w-full gap-2">
								<Reorder.Group
									axis="y"
									layotScroll
									values={value}
									onReorder={setValue}
									className="flex flex-col gap-2 overflow-y-scroll scrollbar-hide"
								>
									{value.map((item) => (
										<NodePropertyArrayInputItem
											key={item.id}
											value={item}
											innerType={props.innerType}
											values={value}
											setValue={setValue}
										/>
									))}
								</Reorder.Group>
								<Button
									className="w-full"
									startContent={<Icon className="scale-150" icon="mdi:plus" />}
									isIconOnly
									onPress={() => {
										setValue([
											...value,
											new WrappedValue(getDefaultValue(props.innerType)),
										]);
									}}
								/>
							</div>
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

function NodePropertyDatePicker() {
	const ctx = useContext(NodeIndependentPropertyContext);
	if (!ctx)
		throw new Error(
			"cannot render NodePropertyDatePicker without a NodeIndependentPropertyContext",
		);

	const rawValue = ctx.override?.getter
		? ctx.override.getter()
		: (getNodeEntryProperty(ctx.node, ctx.handle, "value") ??
			ctx.default ??
			null);
	const [value, setValue] = useState<ZonedDateTime | null>(
		rawValue
			? parseZonedDateTime(
					dateTimeFromAny(rawValue).toISO({
						extendedZone: true,
					}) ?? "",
				)
			: null,
	);

	useEffect(() => {
		const date = value
			? DateTime.fromObject({
					year: value.year,
					day: value.day,
					month: value.month,
				})
					.setZone(value.timeZone)
					.toJSON()
			: undefined;
		ctx.override?.setter
			? ctx.override?.setter(date)
			: setNodeEntryIndependentValue(ctx.node, ctx.handle, date);
	}, [ctx.override, ctx.handle, ctx.node, value]);

	return (
		<DatePicker
			style={{ minWidth: "15rem" }}
			popoverProps={{ className: "min-w-fit" }}
			aria-label={ctx.renderOptions.placeholder(ctx.handle)}
			className="nodrag"
			value={value}
			granularity="second"
			onChange={setValue}
			showMonthAndYearPickers
			hideTimeZone
		/>
	);
}

function NodePropertyGenericSelect() {
	const ctx = useContext(NodeIndependentPropertyContext);
	if (!ctx)
		throw new Error(
			"cannot render NodePropertyGenericSelect without a NodeIndependentPropertyContext",
		);
	const options = isPicklist(ctx.schema)
		? ctx.schema.options
		: isEnum(ctx.schema)
			? Object.keys(ctx.schema.enum)
			: [];

	const items = options
		.map((key) => ctx.renderOptions.options(ctx.handle, key))
		.filter((i) => i !== undefined);

	const [value, setValue] = useState<string | undefined>(
		(ctx.override?.getter
			? ctx.override.getter()
			: (getNodeEntryProperty(ctx.node, ctx.handle, "value") ?? ctx.default)) as
			| string
			| undefined,
	);

	useEffect(() => {
		ctx.override?.setter
			? ctx.override.setter(value)
			: setNodeEntryIndependentValue(ctx.node, ctx.handle, value);
	}, [ctx.override, ctx.handle, ctx.node, value]);

	return (
		<Select
			style={{ minWidth: "15rem" }}
			popoverProps={{ className: "min-w-fit" }}
			aria-label={ctx.renderOptions.placeholder(ctx.handle)}
			placeholder={ctx.renderOptions.placeholder(ctx.handle)}
			className="nodrag"
			onSelectionChange={(selection) => {
				if (selection.currentKey)
					setNodeEntryIndependentValue(
						ctx.node,
						ctx.handle,
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

function NodePropertyGenericInput<T extends string | number | boolean>() {
	const ctx = useContext(NodeIndependentPropertyContext);
	if (!ctx)
		throw new Error(
			"cannot render NodePropertyGenericInput without a NodeIndependentPropertyContext",
		);
	const [value, setValue] = useState<T | undefined>(
		(ctx.override?.getter
			? ctx.override.getter()
			: (getNodeEntryProperty(ctx.node, ctx.handle, "value") ?? ctx.default)) as
			| T
			| undefined,
	);
	const [issues, setIssues] = useState<BaseIssue<unknown>[]>([]);
	const locale = useLocaleInformation();

	useEffect(() => {
		if (ctx.validator === undefined || value === undefined) return;

		const validationResult = ctx.validator(
			{ value: value },
			{ lang: locale.id },
		);
		setIssues(
			validationResult.issues === undefined ? [] : validationResult.issues,
		);
	}, [ctx.validator, value, locale]);

	useEffect(() => {
		ctx.override?.setter
			? ctx.override.setter(value)
			: setNodeEntryIndependentValue(ctx.node, ctx.handle, value);
	}, [ctx.override, ctx.handle, ctx.node, value]);

	if (typeof ctx.default === "boolean") {
		return (
			<Checkbox
				aria-label={ctx.renderOptions.placeholder(ctx.handle)}
				isSelected={value as boolean | undefined}
				onValueChange={(selected) =>
					(setValue as React.Dispatch<boolean>)(selected)
				}
				className="nodrag"
				isInvalid={issues.length > 0}
			/>
		);
	}

	if (typeof ctx.default === "string") {
		return (
			<Input
				aria-label={ctx.renderOptions.placeholder(ctx.handle)}
				placeholder={ctx.renderOptions.placeholder(ctx.handle)}
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

	if (typeof ctx.default === "number") {
		return (
			<NumberInput
				aria-label={ctx.renderOptions.placeholder(ctx.handle)}
				placeholder={ctx.renderOptions.placeholder(ctx.handle)}
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
