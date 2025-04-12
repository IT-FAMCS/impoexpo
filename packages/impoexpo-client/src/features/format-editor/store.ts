import { baseNodesMap } from "@impoexpo/shared/nodes/node-database";
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
} from "@xyflow/react";
import { createResettable, WIZARD_STORE_CATEGORY } from "@/stores/resettable";
import { persistStoreOnReload } from "@/stores/hot-reload";
import type { NodeInternalData } from "./nodes/renderable-node-types";
import {
	getEntrySource,
	findCompatibleEntry,
} from "@impoexpo/shared/nodes/node-utils";

const nodeCount: Map<string, number> = new Map();
export const getNodeId = (type: string) => {
	if (!nodeCount.has(type)) nodeCount.set(type, 0);
	// biome-ignore lint/style/noNonNullAssertion: checked on the line above
	const next = nodeCount.get(type)! + 1;
	nodeCount.set(type, next);
	return `${type}-${next}`;
};

export type FormatEditorStore = {
	nodes: Node<NodeInternalData>[];
	edges: Edge[];
	onNodesChange: OnNodesChange<Node<NodeInternalData>>;
	onEdgesChange: OnEdgesChange;
	onConnect: OnConnect;
	setNodes: (nodes: Node<NodeInternalData>[]) => void;
	setEdges: (edges: Edge[]) => void;
	attachNewNode: (
		fromNodeId: string,
		fromNodeType: string,
		toNodeType: string,
		fromHandleId: string,
		position: { x: number; y: number },
	) => void;
	addNewNode: (type: string, position: { x: number; y: number }) => void;

	edgeReconnectSuccessful: boolean;
	onReconnect: OnReconnect;
	onReconnectStart: () => void;
	onReconnectEnd: (
		event: MouseEvent | TouchEvent,
		edge: Edge,
		handle: HandleType,
	) => void;
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

	addNewNode(type, position) {
		const toData = baseNodesMap.get(type);
		if (!toData) return;
		const id = getNodeId(type);

		const newNode = {
			id: id,
			position: position,
			data: { resolvedTypes: {} },
			type: type,
		} satisfies Node<NodeInternalData>;
		get().setNodes(get().nodes.concat(newNode));
	},

	attachNewNode(fromNodeId, fromNodeType, toNodeType, fromHandleId, position) {
		const fromData = baseNodesMap.get(fromNodeType);
		const toData = baseNodesMap.get(toNodeType);
		if (!fromData || !toData) return;

		const fromSource = getEntrySource(fromData, fromHandleId);
		const [name] = findCompatibleEntry(fromData, fromHandleId, toData);
		const id = getNodeId(toNodeType);

		const newNode = {
			id: id,
			position: position,
			data: { resolvedTypes: {} },
			type: toNodeType,
		} satisfies Node<NodeInternalData>;

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
}));

persistStoreOnReload("formatEditorStore", useFormatEditorStore);
