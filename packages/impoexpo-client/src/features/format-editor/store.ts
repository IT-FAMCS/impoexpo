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
import { create } from "zustand/react";
import { findCompatibleHandle } from "./nodes/node-schema-helpers";

const nodeCount: Map<string, number> = new Map();
export const getNodeId = (type: string) => {
	if (!nodeCount.has(type)) nodeCount.set(type, 0);
	// biome-ignore lint/style/noNonNullAssertion: checked on the line above
	const next = nodeCount.get(type)! + 1;
	nodeCount.set(type, next);
	return `${type}-${next}`;
};

const initialNodes: Node[] = [
	{
		id: "console-test-in-1",
		data: {},
		position: { x: 300, y: 100 },
		type: "console-test-in",
	},
	{
		id: "console-test-in-2",
		data: {},
		position: { x: 800, y: 100 },
		type: "console-test-in",
	},
	{
		id: "console-test-out",
		data: {},
		position: { x: 50, y: 200 },
		type: "console-test-out",
	},
];
const initialEdges: Edge[] = [];

export type FormatEditorStore = {
	nodes: Node[];
	edges: Edge[];
	onNodesChange: OnNodesChange<Node>;
	onEdgesChange: OnEdgesChange;
	onConnect: OnConnect;
	setNodes: (nodes: Node[]) => void;
	setEdges: (edges: Edge[]) => void;
	attachNewNode: (
		fromNodeId: string,
		fromNodeType: string,
		toNodeType: string,
		fromHandleId: string,
		position: { x: number; y: number },
	) => void;

	edgeReconnectSuccessful: boolean;
	onReconnect: OnReconnect;
	onReconnectStart: () => void;
	onReconnectEnd: (
		event: MouseEvent | TouchEvent,
		edge: Edge,
		handle: HandleType,
	) => void;
};

export const useFormatEditorStore = create<FormatEditorStore>((set, get) => ({
	nodes: initialNodes,
	edges: initialEdges,
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

	attachNewNode(fromNodeId, fromNodeType, toNodeType, fromHandleId, position) {
		const fromData = baseNodesMap.get(fromNodeType);
		const toData = baseNodesMap.get(toNodeType);
		if (!fromData || !toData) return;

		const [name] = findCompatibleHandle(fromData, fromHandleId, toData);
		const id = getNodeId(toNodeType);

		const newNode = {
			id: id,
			position: position,
			data: {},
			type: toNodeType,
		} satisfies Node;

		get().setNodes(get().nodes.concat(newNode));
		get().setEdges(
			get().edges.concat({
				id: id,
				source: fromNodeId,
				sourceHandle: fromHandleId,
				target: id,
				targetHandle: name,
			}),
		);
	},
}));
