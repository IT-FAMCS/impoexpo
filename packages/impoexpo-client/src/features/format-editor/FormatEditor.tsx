import {
	type Node,
	Background,
	Controls,
	ReactFlow,
	type Edge,
	type OnNodesChange,
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	type OnConnect,
	type OnEdgesChange,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./nodes/console";
import { useShallow } from "zustand/react/shallow";
import { useCallback, useState } from "react";
import { useRenderableNodesStore } from "./nodes/renderable-node-types";

const initialNodes: Node[] = [
	{ id: "meow", data: {}, position: { x: 50, y: 50 }, type: "console-write" },
];

export default function FormatEditor() {
	const [nodes, setNodes] = useState<Node[]>(initialNodes);
	const [edges, setEdges] = useState<Edge[]>([]);
	const nodeRenderers = useRenderableNodesStore(
		useShallow((state) => state.nodeRenderers),
	);

	const onNodesChange: OnNodesChange = useCallback(
		(changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
		[],
	);
	const onEdgesChange: OnEdgesChange = useCallback(
		(changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
		[],
	);
	const onConnect: OnConnect = useCallback(
		(connection) => setEdges((eds) => addEdge(connection, eds)),
		[],
	);

	return (
		<div className="w-full h-full">
			<ReactFlow
				nodes={nodes}
				nodeTypes={nodeRenderers}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				proOptions={{ hideAttribution: true }}
			>
				<Controls showFitView={false} />
				<Background size={2} />
			</ReactFlow>
		</div>
	);
}
