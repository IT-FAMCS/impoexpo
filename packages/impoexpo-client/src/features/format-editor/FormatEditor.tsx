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
import {
	FLOW_HANDLE_MARKER,
	useRenderableNodesStore,
} from "./nodes/renderable-node-types";
import { baseNodesMap } from "@impoexpo/shared";
import { areNodesConnectable } from "./nodes/node-schema-helpers";

const initialNodes: Node[] = [
	{
		id: "meow",
		data: {},
		position: { x: 300, y: 100 },
		type: "console-test-in",
	},
	{
		id: "meow2",
		data: {},
		position: { x: 50, y: 200 },
		type: "console-test-out",
	},
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
				isValidConnection={(connection) => {
					if (!connection.sourceHandle || !connection.targetHandle)
						return false;
					if (
						connection.sourceHandle.startsWith(FLOW_HANDLE_MARKER) &&
						connection.targetHandle.startsWith(FLOW_HANDLE_MARKER) &&
						connection.source === connection.target
					)
						return false;

					if (
						connection.sourceHandle.startsWith(FLOW_HANDLE_MARKER) &&
						(!connection.targetHandle.startsWith(FLOW_HANDLE_MARKER) ||
							connection.sourceHandle === connection.targetHandle)
					)
						return false;
					if (
						connection.targetHandle.startsWith(FLOW_HANDLE_MARKER) &&
						(!connection.sourceHandle.startsWith(FLOW_HANDLE_MARKER) ||
							connection.sourceHandle === connection.targetHandle)
					)
						return false;

					const sourceType = nodes.find(
						(n) => n.id === connection.source,
					)?.type;
					const targetType = nodes.find(
						(n) => n.id === connection.target,
					)?.type;
					if (!sourceType || !targetType) return false;

					const source = baseNodesMap.get(sourceType);
					const target = baseNodesMap.get(targetType);
					if (!source || !target) return false;

					return areNodesConnectable(
						source,
						target,
						connection.sourceHandle,
						connection.targetHandle,
					);
				}}
				proOptions={{ hideAttribution: true }}
			>
				<Controls showFitView={false} />
				<Background size={2} />
			</ReactFlow>
		</div>
	);
}
