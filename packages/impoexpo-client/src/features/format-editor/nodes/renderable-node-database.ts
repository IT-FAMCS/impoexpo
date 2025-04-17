import { create as createDatabase, insert, type Orama } from "@orama/orama";

import "./builtin/notifications";
import "./builtin/math";
import "./builtin/strings";
import "./builtin/conditional";
import "./builtin/operators";

import { create } from "zustand/react";
import { supportedLocales } from "@/locales/supportedLocales";
import { persistStoreOnReload } from "@/stores/hot-reload";
import type { BaseNode } from "@impoexpo/shared/nodes/node-types";
import type { MessageDescriptor } from "@lingui/core";
import type { ObjectEntries } from "valibot";
import DefaultNodeRenderer from "../DefaultNodeRenderer";
import {
	type RawNodeRenderOptions,
	NodeRenderOptions,
	localizableString,
	type IconRenderFunction,
	type DefaultNodeRenderOptions,
} from "./renderable-node-types";
import type { NodeTypes } from "@xyflow/react";
import type { DefaultBaseNode } from "@impoexpo/shared/nodes/node-utils";

const searchInitializers: Array<
	(database: Orama<typeof nodesDatabaseSchema>) => void
> = new Array();
export const searchScope = (
	initializer: (database: Orama<typeof nodesDatabaseSchema>) => void,
) => searchInitializers.push(initializer);

export const nodesDatabaseSchema = {
	title: "string" as const,
	name: "string" as const,
	category: "string" as const,
	id: "string" as const,
	aliases: "string[]" as const,
	tags: "enum[]" as const,
};

export type NodeSearchMetadataStore = {
	database: Orama<typeof nodesDatabaseSchema> | undefined;
	reset: (localeId: string) => void;
};

export const useNodeSearchMetadataStore = create<NodeSearchMetadataStore>(
	(set) => ({
		database: undefined,
		reset: (localeId: string) => {
			const locale = supportedLocales.find((l) => l.id === localeId);
			if (!locale) return;

			console.log(`(re)creating the search database for locale ${locale.id}`);
			const database = createDatabase<typeof nodesDatabaseSchema>({
				schema: nodesDatabaseSchema,
				components: {
					tokenizer: {
						stemming: true,
						stemmerSkipProperties: ["id", "tags"],
						...locale.oramaMetadata,
					},
				},
			});
			for (const initializer of searchInitializers) initializer(database);
			set(() => ({ database: database }));
		},
	}),
);

export const registerWithDefaultRenderer = <
	TSInput extends ObjectEntries,
	TSOutput extends ObjectEntries,
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

		const inputs = Object.keys(node.inputSchema?.entries ?? []);
		const outputs = Object.keys(node.outputSchema?.entries ?? []);
		for (const key of inputs) {
			tags.add(
				`accepts:${node.entry(key).generic ? "generic" : node.entry(key).type}`,
			);
		}
		for (const key of outputs) {
			tags.add(
				`outputs:${node.entry(key).generic ? "generic" : node.entry(key).type}`,
			);
		}

		if (
			inputs.length > 0 &&
			inputs.length !== inputs.filter((k) => node.entry(k).generic).length
		)
			tags.add("accepts");
		if (
			outputs.length > 0 &&
			outputs.length !== outputs.filter((k) => node.entry(k).generic).length
		)
			tags.add("outputs");

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

export type RenderableNodesStore = {
	nodeRenderers: NodeTypes;
	nodeRenderOptions: Map<
		string,
		NodeRenderOptions<ObjectEntries, ObjectEntries>
	>;
	categoryRenderOptions: Map<
		string,
		{
			icon?: IconRenderFunction;
			header?: string;
			name: MessageDescriptor | string;
		}
	>;
	genericNodes: Record<
		string,
		{
			base: DefaultBaseNode;
			node: DefaultBaseNode;
		}
	>;

	addGenericNodeInstance: (
		base: DefaultBaseNode,
		instance: DefaultBaseNode,
	) => void;
	removeGenericNodeInstance: (key: string) => void;
	isGeneric: (node: DefaultBaseNode) => boolean;

	unregisterRenderOptions: (type: string) => void;
};

export const useRenderableNodesStore = create<RenderableNodesStore>(
	(set, get) => ({
		nodeRenderers: {},
		categoryRenderOptions: new Map(),
		nodeRenderOptions: new Map(),
		genericNodes: {},

		addGenericNodeInstance: (base, instance) =>
			set((state) => ({
				genericNodes: Object.assign(state.genericNodes, {
					[`${instance.category}-${instance.name}`]: {
						base: base,
						node: instance,
					},
				}),
			})),

		removeGenericNodeInstance: (key) =>
			set((state) => {
				if (key in state.genericNodes) delete state.genericNodes[key];
				return state;
			}),

		isGeneric: (node) => `${node.category}-${node.name}` in get().genericNodes,

		unregisterRenderOptions: (type) =>
			set((state) => {
				delete state.nodeRenderers[type];
				state.nodeRenderOptions.delete(type);
				return state;
			}),
	}),
);

export const registerCategory = (
	id: string,
	data: {
		name: MessageDescriptor;
		header?: string;
		icon?: IconRenderFunction;
	},
) =>
	useRenderableNodesStore.setState((state) => {
		return {
			categoryRenderOptions: new Map(state.categoryRenderOptions).set(id, data),
		};
	});

export const getNodeRenderOptions = (
	type: string,
): DefaultNodeRenderOptions => {
	const optionsMap = useRenderableNodesStore.getState().nodeRenderOptions;
	if (!optionsMap.has(type))
		throw new Error(`no node render options were found for node "${type}"`);
	// biome-ignore lint/style/noNonNullAssertion: checked above
	return optionsMap.get(type)!;
};

persistStoreOnReload("renderableNodes", useRenderableNodesStore);
persistStoreOnReload("nodeSearchMetadata", useNodeSearchMetadataStore);
