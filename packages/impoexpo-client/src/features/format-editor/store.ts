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

const initialNodes: Node[] = [
	{
		id: "meow",
		data: {},
		position: { x: 300, y: 100 },
		type: "console-test-in",
	},
	{
		id: "meow22",
		data: {},
		position: { x: 800, y: 100 },
		type: "console-test-in",
	},
	{
		id: "meow2",
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
}));
