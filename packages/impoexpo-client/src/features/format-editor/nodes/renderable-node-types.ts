// this is probably some of the worst typescript code i have ever written
// sorry

import { persistStoreOnReload } from "@/stores/hot-reload";
import type {
	AllowedObjectEntry,
	BaseNode,
	NodePropertyOptions,
} from "@impoexpo/shared/nodes/node-types";
import { unwrapNodeIfNeeded } from "@impoexpo/shared/nodes/node-utils";
import { type MessageDescriptor, i18n } from "@lingui/core";
import { insert } from "@orama/orama";
import type { NodeTypes } from "@xyflow/react";
import type React from "react";
import { create } from "zustand";
import DefaultNodeRenderer from "../DefaultNodeRenderer";
import { searchScope } from "./node-database";

export type NodePropertyMode = "independentOnly" | "dependentOnly" | "hybrid";
export type IconRenderFunction = (size: number) => React.ReactNode;
export const localizableString = (
	str: MessageDescriptor | string,
	localizer?: (msg: MessageDescriptor) => string,
) => (typeof str === "string" ? str : localizer ? localizer(str) : i18n.t(str));

// TODO: implementing typescript strictness here is very difficult
// and probably not required? who knows
export type NodeInternalData = Partial<{
	resolvedTypes: Record<string, AllowedObjectEntry>;
}>;

export type RenderableNodesStore = {
	nodeRenderers: NodeTypes;
	nodeRenderOptions: Map<
		string,
		NodeRenderOptions<
			Record<string, AllowedObjectEntry>,
			Record<string, AllowedObjectEntry>
		>
	>;
	categoryRenderOptions: Map<
		string,
		{
			icon: IconRenderFunction;
			name: MessageDescriptor | string;
		}
	>;
};

export class NodeRenderOptions<
	TSInput extends Record<string, AllowedObjectEntry>,
	TSOutput extends Record<string, AllowedObjectEntry>,
> {
	public raw: RawNodeRenderOptions<TSInput, TSOutput>;
	public node: BaseNode<TSInput, TSOutput>;
	constructor(
		node: BaseNode<TSInput, TSOutput>,
		raw: RawNodeRenderOptions<TSInput, TSOutput>,
	) {
		this.node = node;
		this.raw = raw;
	}

	public input<TKey extends keyof TSInput>(
		key: TKey,
	): NodePropertyMetadata<TSInput[TKey], true> | undefined {
		if (!("inputs" in this.raw) || !this.raw.inputs) {
			throw new Error(
				"NodeRenderOptions.input() was somehow called despite the node not having an input schema",
			);
		}
		return this.raw.inputs[key];
	}

	public output<TKey extends keyof TSOutput>(
		key: TKey,
	): NodePropertyMetadata<TSOutput[TKey], false> | undefined {
		if (!("outputs" in this.raw) || !this.raw.outputs) {
			throw new Error(
				"NodeRenderOptions.output() was somehow called despite the node not having an output schema",
			);
		}
		return this.raw.outputs[key];
	}

	property<TKey extends keyof TSInput | keyof TSOutput>(
		key: TKey,
	): NodePropertyMetadata<AllowedObjectEntry, true> | undefined {
		return key in (this.node.inputSchema ?? {})
			? this.input(key as keyof TSInput)
			: this.output(key as keyof TSOutput);
	}

	public title<TKey extends keyof TSInput | keyof TSOutput>(key: TKey): string {
		return localizableString(this.property(key)?.title ?? String(key));
	}

	public description<TKey extends keyof TSInput | keyof TSOutput>(
		key: TKey,
	): string {
		return localizableString(this.property(key)?.description ?? String(key));
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

export type RawNodeRenderOptions<
	TSInput extends Record<string, AllowedObjectEntry>,
	TSOutput extends Record<string, AllowedObjectEntry>,
> = Partial<{
	icon: IconRenderFunction;
	header: string;
	searchable: boolean;
	aliases: (MessageDescriptor | string)[];
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
	TProperty extends AllowedObjectEntry,
	TIsInput extends boolean,
> = Partial<
	{
		title: MessageDescriptor | string;
		description: MessageDescriptor | string;
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

export const registerWithDefaultRenderer = <
	TSInput extends Record<string, AllowedObjectEntry>,
	TSOutput extends Record<string, AllowedObjectEntry>,
>(
	node: BaseNode<TSInput, TSOutput>,
	options: RawNodeRenderOptions<TSInput, TSOutput>,
) => {
	const type = `${node.category}-${node.name}`;
	useRenderableNodesStore.setState((state) => {
		return {
			nodeRenderers: Object.assign(state.nodeRenderers, {
				[type]: DefaultNodeRenderer,
			}),
			nodeRenderOptions: new Map(state.nodeRenderOptions).set(
				type,
				new NodeRenderOptions(node, options),
			),
		};
	});

	if (options.searchable ?? true) {
		const tags: Set<string> = new Set();
		for (const entry of Object.values(node.inputSchema?.entries ?? [])) {
			tags.add(`accepts:${unwrapNodeIfNeeded(entry).expects}`);
		}
		for (const entry of Object.values(node.outputSchema?.entries ?? [])) {
			tags.add(`outputs:${unwrapNodeIfNeeded(entry).expects}`);
		}

		const categoryRenderOptions = useRenderableNodesStore
			.getState()
			.categoryRenderOptions.get(node.category);

		searchScope((database) => {
			insert(database, {
				category:
					categoryRenderOptions?.name !== undefined
						? localizableString(categoryRenderOptions?.name)
						: node.category,
				name: node.name,
				title:
					options.title !== undefined ? localizableString(options.title) : "",
				id: type,
				aliases: (options.aliases ?? []).map((alias) =>
					localizableString(alias),
				),
				tags: Array.from(tags),
			});
		});
	}
};

export const useRenderableNodesStore = create<RenderableNodesStore>(() => ({
	nodeRenderers: {},
	categoryRenderOptions: new Map(),
	nodeRenderOptions: new Map(),
}));

export const registerCategory = (
	id: string,
	name: MessageDescriptor,
	icon: IconRenderFunction,
) =>
	useRenderableNodesStore.setState((state) => {
		return {
			categoryRenderOptions: new Map(state.categoryRenderOptions).set(id, {
				icon: icon,
				name: name,
			}),
		};
	});

persistStoreOnReload("renderableNodes", useRenderableNodesStore);
