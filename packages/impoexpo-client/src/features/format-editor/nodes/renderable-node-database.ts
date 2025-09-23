import { create as createDatabase, insert, type Orama } from "@orama/orama";
import { create } from "zustand/react";
import { locales } from "@/locales/i18n";
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

export const importBuiltinNodes = async () => {
	console.log("importing built-in nodes");
	await Promise.all(
		Object.values(import.meta.glob("./builtin/*.tsx")).map((v) => v()),
	);
};

export const importIntegrationNodes = async () => {
	console.log("importing integration nodes");
	await Promise.all(
		Object.values(import.meta.glob("../../../integrations/**/nodes.tsx")).map(
			(v) => v(),
		),
	);
};

const searchInitializers: ((
	database: Orama<typeof nodesDatabaseSchema>,
) => void)[] = [];
export const searchScope = (
	initializer: (database: Orama<typeof nodesDatabaseSchema>) => void,
) => searchInitializers.push(initializer);

export const nodesDatabaseSchema = {
	title: "string" as const,
	name: "string" as const,
	category: "string" as const,
	id: "string" as const,
	aliases: "string[]" as const,
};

export type NodeSearchMetadataStore = {
	database: Orama<typeof nodesDatabaseSchema> | undefined;
	reset: (localeId: string) => void;
};

export const useNodeSearchMetadataStore = create<NodeSearchMetadataStore>(
	(set) => ({
		database: undefined,
		reset: (localeId: string) => {
			const locale = locales.find((l) => l.id === localeId);
			if (!locale) return;

			console.log(`(re)creating the search database for locale ${locale.id}`);
			const database = createDatabase<typeof nodesDatabaseSchema>({
				schema: nodesDatabaseSchema,
				components: {
					tokenizer: {
						stemming: true,
						stemmerSkipProperties: ["id"],
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
			nodeRenderOptions: {
				...state.nodeRenderOptions,
				[type]: new NodeRenderOptions(node, options),
			},
		};
	});

	if (options.searchable ?? true) {
		const categoryRenderOptions =
			useRenderableNodesStore.getState().categoryRenderOptions[node.category];

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
				aliases: localizableString(options.aliases ?? "")
					.split(",")
					.map((s) => s.trim()),
			});
		});
	}
};

export type RenderableNodesStore = {
	nodeRenderers: NodeTypes;
	nodeRenderOptions: Record<
		string,
		NodeRenderOptions<ObjectEntries, ObjectEntries>
	>;
	categoryRenderOptions: Record<
		string,
		{
			icon?: IconRenderFunction;
			header?: string;
			documentationLink?: string;
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
	getTrueGenericNodeBase: (key: string) => DefaultBaseNode | undefined;
	isGeneric: (node: DefaultBaseNode) => boolean;

	unregisterRenderOptions: (type: string) => void;
};

export const useRenderableNodesStore = create<RenderableNodesStore>(
	(set, get) => ({
		nodeRenderers: {},
		categoryRenderOptions: {},
		nodeRenderOptions: {},
		genericNodes: {},

		addGenericNodeInstance: (base, instance) =>
			set((state) => ({
				genericNodes: {
					...state.genericNodes,
					[`${instance.category}-${instance.name}`]: {
						base: base,
						node: instance,
					},
				},
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
				delete state.nodeRenderOptions[type];
				return state;
			}),

		getTrueGenericNodeBase(key) {
			const genericNodes = get().genericNodes;
			if (!(key in genericNodes)) return undefined;
			let base = genericNodes[key].base;
			while (`${base.category}-${base.name}` in genericNodes)
				base = genericNodes[`${base.category}-${base.name}`].base;
			return base;
		},
	}),
);

export const registerCategory = (
	id: string,
	data: {
		name: MessageDescriptor;
		header?: string;
		icon?: IconRenderFunction;
		documentationLink?: string;
	},
) =>
	useRenderableNodesStore.setState((state) => {
		return {
			categoryRenderOptions: { ...state.categoryRenderOptions, [id]: data },
		};
	});

export const getNodeRenderOptions = (
	type: string,
): DefaultNodeRenderOptions => {
	const optionsMap = useRenderableNodesStore.getState().nodeRenderOptions;
	if (!(type in optionsMap))
		throw new Error(`no node render options were found for node "${type}"`);
	return optionsMap[type];
};

persistStoreOnReload("renderableNodes", useRenderableNodesStore);
persistStoreOnReload("nodeSearchMetadata", useNodeSearchMetadataStore);
