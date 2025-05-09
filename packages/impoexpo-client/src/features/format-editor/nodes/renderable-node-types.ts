import type {
	ObjectEntry,
	BaseNode,
	NodePropertyOptions,
} from "@impoexpo/shared/nodes/node-types";
import { type MessageDescriptor, i18n } from "@lingui/core";
import type React from "react";
import type { ObjectEntries } from "valibot";
import { useRenderableNodesStore } from "./renderable-node-database";
import type { Node } from "@xyflow/react";
import type { ProjectNodeEntry } from "@impoexpo/shared/schemas/project/ProjectSchema";
import { isFlow } from "@impoexpo/shared/nodes/node-utils";

export type FlowParent = { node: string; entry: string };
export type ProjectNode = Node<{
	entries?: Record<string, ProjectNodeEntry>;
	flow?: FlowParent;
}>;

export type NodePropertyMode = "independentOnly" | "dependentOnly" | "hybrid";
export type NodePropertySeparator = "before" | "after" | "both" | "none";

export type IconRenderFunction = (size: number) => React.ReactNode;
export const localizableString = (
	str: MessageDescriptor | string,
	localizer?: (msg: MessageDescriptor) => string,
) => (typeof str === "string" ? str : localizer ? localizer(str) : i18n.t(str));

export type DefaultNodeRenderOptions = NodeRenderOptions<
	ObjectEntries,
	ObjectEntries
>;

export type RawNodeRenderOptions<
	TSInput extends ObjectEntries,
	TSOutput extends ObjectEntries,
> = Partial<{
	icon: IconRenderFunction;
	header: string;
	searchable: boolean;
	aliases: MessageDescriptor | string;
	title: MessageDescriptor | string;
}> &
	(keyof TSInput extends never
		? // biome-ignore lint/complexity/noBannedTypes: empty type required here
			{}
		: Partial<{
				inputs: Partial<{
					[key in keyof TSInput]: NodePropertyMetadata<TSInput[key], true>;
				}>;
			}>) &
	(keyof TSOutput extends never
		? // biome-ignore lint/complexity/noBannedTypes: empty type required here
			{}
		: Partial<{
				outputs: Partial<{
					[key in keyof TSOutput]: NodePropertyMetadata<TSOutput[key], false>;
				}>;
			}>);

export type NodePropertyMetadata<
	TProperty extends ObjectEntry,
	TIsInput extends boolean,
> = Partial<
	{
		title: MessageDescriptor | string;
		description: MessageDescriptor | string;
		separate: NodePropertySeparator;
	} & (TIsInput extends true
		? { placeholder: MessageDescriptor | string; mode: NodePropertyMode }
		: // biome-ignore lint/complexity/noBannedTypes: empty type required here
			{}) &
		(NodePropertyOptions<TProperty> extends never
			? // biome-ignore lint/complexity/noBannedTypes: empty type required here
				{}
			: {
					options: Partial<
						Record<
							Exclude<NodePropertyOptions<TProperty>, bigint>,
							NodePropertyOptionsMetadata<MessageDescriptor | string>
						>
					>;
				})
>;

export type NodePropertyOptionsMetadata<T> = Partial<{
	key: string;
	title: T;
	description: T;
}>;

export class NodeRenderOptions<
	TSInput extends ObjectEntries,
	TSOutput extends ObjectEntries,
> {
	public raw: RawNodeRenderOptions<TSInput, TSOutput>;
	public node: BaseNode<TSInput, TSOutput>;
	constructor(
		node: BaseNode<TSInput, TSOutput>,
		raw: RawNodeRenderOptions<TSInput, TSOutput>,
	) {
		this.node = node;
		this.raw = raw;
		if (!("inputs" in this.raw) || !this.raw.inputs)
			Object.assign(this.raw, { inputs: {} });
		if (!("outputs" in this.raw) || !this.raw.outputs)
			Object.assign(this.raw, { outputs: {} });

		const { categoryRenderOptions } = useRenderableNodesStore.getState();
		if (!this.raw.icon && categoryRenderOptions.has(this.node.category))
			this.raw.icon = categoryRenderOptions.get(this.node.category)?.icon;
	}

	public input<TKey extends keyof TSInput>(
		key: TKey,
	): NodePropertyMetadata<TSInput[TKey], true> | undefined {
		if (!("inputs" in this.raw) || !this.raw.inputs) {
			throw new Error(
				"NodeRenderOptions.input() was called despite the node not having an input schema",
			);
		}
		return this.raw.inputs[key];
	}

	public output<TKey extends keyof TSOutput>(
		key: TKey,
	): NodePropertyMetadata<TSOutput[TKey], false> | undefined {
		if (!("outputs" in this.raw) || !this.raw.outputs) {
			throw new Error(
				"NodeRenderOptions.output() was called despite the node not having an output schema",
			);
		}
		return this.raw.outputs[key];
	}

	property<TKey extends keyof TSInput | keyof TSOutput>(
		key: TKey,
	): NodePropertyMetadata<ObjectEntry, true> | undefined {
		return key in (this.node.inputSchema?.entries ?? {})
			? this.input(key as keyof TSInput)
			: this.output(key as keyof TSOutput);
	}

	public title<TKey extends keyof TSInput | keyof TSOutput>(key: TKey): string {
		return localizableString(this.property(key)?.title ?? String(key));
	}

	public description<TKey extends keyof TSInput | keyof TSOutput>(
		key: TKey,
	): string {
		const property = this.property(key);
		if (property?.description) return localizableString(property.description);
		if (isFlow(this.node.entry(String(key)).schema)) return "";

		return this.node.entry(String(key)).type;
	}

	public separate<TKey extends keyof TSInput | keyof TSOutput>(
		key: TKey,
	): NodePropertySeparator {
		return this.property(key)?.separate ?? "none";
	}

	public placeholder<TKey extends keyof TSInput | keyof TSOutput>(
		key: TKey,
	): string {
		return localizableString(this.property(key)?.placeholder ?? String(key));
	}

	public options<TInputName extends keyof TSInput>(
		inputName: TInputName,
		key: string,
	): NodePropertyOptionsMetadata<string> | undefined {
		const input = this.input(inputName);
		if (!input || !("options" in input)) return undefined;

		const keyString = String(key);
		const options = input.options as Partial<
			Record<string, NodePropertyOptionsMetadata<MessageDescriptor | string>>
		>;
		if (!(key in options)) return { key: keyString, title: keyString };

		const option = options[keyString];
		return {
			key: keyString,
			title: localizableString(option?.title ?? keyString),
			description: option?.description
				? localizableString(option?.description)
				: undefined,
		};
	}
}
