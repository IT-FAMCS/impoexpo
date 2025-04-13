import {
	getBaseNode,
	registerBaseNodes,
	unregisterBaseNodes,
} from "@impoexpo/shared/nodes/node-database";
import {
	type Node,
	type Edge,
	type OnNodesChange,
	type OnEdgesChange,
	type OnConnect,
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	type OnReconnect,
	type HandleType,
	reconnectEdge,
	getOutgoers,
	getConnectedEdges,
} from "@xyflow/react";
import { createResettable, WIZARD_STORE_CATEGORY } from "@/stores/resettable";
import { persistStoreOnReload } from "@/stores/hot-reload";
import {
	type DefaultBaseNode,
	findCompatibleEntry,
} from "@impoexpo/shared/nodes/node-utils";
import { BaseNode, type ObjectEntry } from "@impoexpo/shared/nodes/node-types";
import { deepCopy } from "deep-copy-ts";
import {
	registerWithDefaultRenderer,
	useRenderableNodesStore,
} from "./nodes/renderable-node-database";
import type { DefaultNodeRenderOptions } from "./nodes/renderable-node-types";

const nodeCount: Map<string, number> = new Map();
export const getNodeId = (type: string) => {
	if (!nodeCount.has(type)) nodeCount.set(type, 0);
	// biome-ignore lint/style/noNonNullAssertion: checked on the line above
	const next = nodeCount.get(type)! + 1;
	nodeCount.set(type, next);
	return `${type}-${next}`;
};

export type FormatEditorStore = {
	nodes: Node[];
	edges: Edge[];
	onNodesChange: OnNodesChange<Node>;
	onEdgesChange: OnEdgesChange;
	onConnect: OnConnect;
	setNodes: (nodes: Node[]) => void;
	setEdges: (edges: Edge[]) => void;
	onNodesDelete: (nodes: Node[]) => void;
	onEdgesDelete: (edges: Edge[]) => void;
	edgeReconnectSuccessful: boolean;
	onReconnect: OnReconnect;
	onReconnectStart: () => void;
	onReconnectEnd: (
		event: MouseEvent | TouchEvent,
		edge: Edge,
		handle: HandleType,
	) => void;

	attachNewNode: (
		fromNodeId: string,
		fromNodeType: string,
		toNodeType: string,
		fromHandleId: string,
		position: { x: number; y: number },
	) => void;
	addNewNode: (type: string, position: { x: number; y: number }) => void;
	resolveGenericNode: (
		base: {
			node: DefaultBaseNode;
			options: DefaultNodeRenderOptions;
		},
		resolvedType: string,
		resolver: {
			type: string;
			schema: ObjectEntry;
		},
		replaceNodeId: string,
	) => void;
	getBaseNodeFromId: (id: string) => DefaultBaseNode | undefined;
};

export const useFormatEditorStore = createResettable<FormatEditorStore>(
	WIZARD_STORE_CATEGORY,
)((set, get) => ({
	nodes: [],
	edges: [],
	onNodesChange: (changes) => {
		set({
			nodes: applyNodeChanges(changes, get().nodes),
		});
	},
	onEdgesChange: (changes) => {
		set({
			edges: applyEdgeChanges(changes, get().edges),
		});
	},
	onConnect: (connection) => {
		set({
			edges: addEdge(connection, get().edges),
		});
	},
	setNodes: (nodes) => {
		set({ nodes });
	},
	setEdges: (edges) => {
		set({ edges });
	},

	edgeReconnectSuccessful: true,
	onReconnectStart() {
		set(() => ({ edgeReconnectSuccessful: false }));
	},
	onReconnectEnd(_, edge) {
		if (!get().edgeReconnectSuccessful) {
			get().setEdges(get().edges.filter((e) => e.id !== edge.id));
		}
	},
	onReconnect(oldEdge, newConnection) {
		get().edgeReconnectSuccessful = true;
		get().setEdges(reconnectEdge(oldEdge, newConnection, get().edges));
	},

	onEdgesDelete(edges) {
		for (const edge of edges) {
			if (!edge.sourceHandle || !edge.targetHandle) continue;
			const { isGeneric, genericNodes } = useRenderableNodesStore.getState();

			const source = get().getBaseNodeFromId(edge.source);
			const target = get().getBaseNodeFromId(edge.target);
			if (!source || !target || (!isGeneric(source) && !isGeneric(target)))
				return;

			let affectedNode: Node;
			let affectedHandle: string;
			let affectedNodeData: DefaultBaseNode;
			let base: DefaultBaseNode;

			if (isGeneric(source)) {
				// biome-ignore lint/style/noNonNullAssertion: why wouldn't it exist
				affectedNode = get().nodes.find((n) => n.id === edge.source)!;
				affectedHandle = edge.sourceHandle;
				// biome-ignore lint/style/noNonNullAssertion: also required to exist
				affectedNodeData = get().getBaseNodeFromId(edge.source)!;
				base = genericNodes[`${source.category}-${source.name}`].base;
			} else {
				// biome-ignore lint/style/noNonNullAssertion: why wouldn't it exist
				affectedNode = get().nodes.find((n) => n.id === edge.target)!;
				affectedHandle = edge.targetHandle;
				// biome-ignore lint/style/noNonNullAssertion: also required to exist
				affectedNodeData = get().getBaseNodeFromId(edge.target)!;
				base = genericNodes[`${target.category}-${target.name}`].base;
			}

			const connectedEdges = getConnectedEdges(get().nodes, get().edges).filter(
				(e) =>
					(e.target === affectedNode.id || e.source === affectedNode.id) &&
					e.id !== edge.id,
			);

			if (
				connectedEdges.some(
					(e) =>
						e.targetHandle &&
						base.hasEntry(e.targetHandle) &&
						base.entry(e.targetHandle).generic,
				) ||
				connectedEdges.some(
					(e) =>
						e.sourceHandle &&
						base.hasEntry(e.sourceHandle) &&
						base.entry(e.sourceHandle).generic,
				)
			)
				continue;

			get().setNodes(
				get().nodes.map((n) =>
					n.id === affectedNode.id
						? { ...affectedNode, type: `${base.category}-${base.name}` }
						: n,
				),
			);
		}
	},

	onNodesDelete(nodes) {
		const { isGeneric, removeGenericNodeInstance, unregisterRenderOptions } =
			useRenderableNodesStore.getState();
		const newNodes = get().nodes.filter((n) => nodes.indexOf(n) === -1);

		for (const node of nodes) {
			const data = get().getBaseNodeFromId(node.id);
			if (!data || !node.type || !isGeneric(data)) continue;
			if (!newNodes.some((n) => n.type === node.type)) {
				removeGenericNodeInstance(node.type);
				unregisterRenderOptions(node.type);
				unregisterBaseNodes(getBaseNode(node.type));
			}
		}
	},

	getBaseNodeFromId: (id) => {
		const type = get().nodes.find((n) => n.id === id)?.type;
		if (!type) return undefined;
		return getBaseNode(type);
	},

	addNewNode(type, position) {
		const id = getNodeId(type);

		const newNode = {
			id: id,
			position: position,
			data: {},
			type: type,
		} satisfies Node;
		get().setNodes(get().nodes.concat(newNode));
	},

	attachNewNode(fromNodeId, fromNodeType, toNodeType, fromHandleId, position) {
		const fromData = getBaseNode(fromNodeType);
		const toData = getBaseNode(toNodeType);

		const fromSource = fromData.entry(fromHandleId).source;
		const [name] = findCompatibleEntry(fromData, fromHandleId, toData);
		const id = getNodeId(toNodeType);

		const newNode = {
			id: id,
			position: position,
			data: {},
			type: toNodeType,
		} satisfies Node;

		get().setNodes(get().nodes.concat(newNode));
		get().setEdges(
			get().edges.concat(
				fromSource === "output"
					? {
							id: id,
							source: fromNodeId,
							sourceHandle: fromHandleId,
							target: id,
							targetHandle: name,
						}
					: {
							id: id,
							source: id,
							sourceHandle: name,
							target: fromNodeId,
							targetHandle: fromHandleId,
						},
			),
		);
	},

	resolveGenericNode(base, resolvedType, resolver, replaceNodeId) {
		const copy = deepCopy(base.node);
		Object.setPrototypeOf(copy, BaseNode.prototype);

		copy.name = `${base.node.name}-${Object.keys(base.node.genericProperties)
			.map((p) => (p === resolvedType ? resolver.type : p))
			.join("-")}`;

		const genericEntries = copy.genericProperties[resolvedType];
		for (const entry of genericEntries)
			copy.setEntrySchema(entry, resolver.schema);
		delete copy.genericProperties[resolvedType];

		const { addGenericNodeInstance } = useRenderableNodesStore.getState();
		addGenericNodeInstance(base.node, copy);
		registerBaseNodes(copy);
		registerWithDefaultRenderer(copy, {
			...base.options.raw,
			searchable: false,
		});

		const replaceNode = get().nodes.find((n) => n.id === replaceNodeId);
		if (!replaceNode) return;

		get().setNodes(
			get().nodes.map((n) =>
				n.id === replaceNodeId
					? { ...replaceNode, type: `${copy.category}-${copy.name}` }
					: n,
			),
		);
	},
}));

persistStoreOnReload("formatEditorStore", useFormatEditorStore);
