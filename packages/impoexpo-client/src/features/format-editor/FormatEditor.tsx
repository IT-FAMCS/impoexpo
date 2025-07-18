import {
	Background,
	type ColorMode,
	type Connection,
	Controls,
	type Edge,
	type FinalConnectionState,
	type OnSelectionChangeFunc,
	Panel,
	ReactFlow,
	getOutgoers,
	useNodesInitialized,
	useOnSelectionChange,
	useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "../../styles/reactflow.css";
import { Button, Kbd, Tooltip, useDisclosure } from "@heroui/react";
import {
	type MouseEvent as ReactMouseEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { nodeSchemasCompatible } from "./nodes/renderable-node-helpers";
import { useRenderableNodesStore } from "./nodes/renderable-node-database";
import SearchNodesModal from "./search-nodes-modal/SearchNodesModal";
import { useSearchNodesModalStore } from "./search-nodes-modal/store";
import { ThemeProps } from "@heroui/use-theme";
import { useFormatEditorStore, useFormatEditorTemporalStore } from "./store";
import { Icon } from "@iconify/react";
import { useHotkeys } from "react-hotkeys-hook";
import { Trans } from "@lingui/react/macro";
import type { ProjectNode } from "./nodes/renderable-node-types";
import { useProjectStore } from "@/stores/project";
import dagre from "@dagrejs/dagre";
import FormatEditorContextMenu, {
	type FormatEditorContextMenuRef,
} from "./FormatEditorContextMenu";
import NestedDropdown from "@/components/external/NestedDropdown";
import {
	FormatEditorWrapperState,
	useFormatEditorWrapperStore,
} from "../transfer-wizard/store";
import ExportProjectModal from "./export-project-modal/ExportProjectModal";

const connectionHasCycles = (
	connection: Connection | Edge,
	nodes: ProjectNode[],
	edges: Edge[],
): boolean => {
	const target = nodes.find((node) => node.id === connection.target);
	if (!target) return false;
	const hasCycle = (node: ProjectNode, visited = new Set()) => {
		if (visited.has(node.id)) return false;
		visited.add(node.id);

		for (const outgoer of getOutgoers(node, nodes, edges)) {
			if (outgoer.id === connection.source) return true;
			if (hasCycle(outgoer, visited)) return true;
		}

		return false;
	};

	if (target.id === connection.source) return false;
	return hasCycle(target);
};

export default function FormatEditor() {
	const {
		edges,
		nodes,
		onConnect,
		onEdgesChange,
		onNodesChange,
		onReconnect,
		onReconnectStart,
		onReconnectEnd,
		onNodesDelete,
		onEdgesDelete,
		onConnectEnd,
		setNodes,
		duplicateNode,
	} = useFormatEditorStore();
	const { undo, redo, futureStates, pastStates } = useFormatEditorTemporalStore(
		(state) => state,
	);

	const nodesLaidOut = useRef(false);
	const nodesInitialized = useNodesInitialized();
	const { screenToFlowPosition, fitView } = useReactFlow();

	const {
		onOpen: openSearchModal,
		isOpen: isSearchModalOpen,
		onOpenChange: onSearchModalOpenChange,
	} = useDisclosure({ id: "SEARCH_NODES_MODAL" });
	const {
		onOpen: openExportProjectModal,
		isOpen: isExportProjectModalOpen,
		onOpenChange: onExportProjectModalOpenChange,
		onClose: onExportProjectModalClose,
	} = useDisclosure({ id: "EXPORT_PROJECT_MODAL" });

	const { setNewNodeInformation } = useSearchNodesModalStore();
	const nodeRenderers = useRenderableNodesStore(
		useShallow((state) => state.nodeRenderers),
	);

	// biome-ignore lint/style/noNonNullAssertion: will be initialized as soon as possible
	const containerRef = useRef<HTMLDivElement>(null!);
	// biome-ignore lint/style/noNonNullAssertion: same thing
	const contextMenuRef = useRef<FormatEditorContextMenuRef>(null!);

	const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
	const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
	const onSelectionChange = useCallback<
		OnSelectionChangeFunc<ProjectNode, Edge>
	>((selection) => {
		setSelectedNodes(selection.nodes.map((n) => n.id));
		setSelectedEdges(selection.edges.map((e) => e.id));
	}, []);
	useOnSelectionChange<ProjectNode>({ onChange: onSelectionChange });

	useHotkeys(
		"ctrl+d",
		() => {
			if (contextMenuRef.current.isOpen()) return;
			for (const id of selectedNodes) duplicateNode(id);
		},
		{ preventDefault: true },
	);

	const mousePositionRef = useRef<{ x: number; y: number } | undefined>();
	useHotkeys(
		"space",
		() => {
			if (!isSearchModalOpen) {
				setNewNodeInformation({
					position: screenToFlowPosition({
						x: mousePositionRef.current?.x ?? 0,
						y: mousePositionRef.current?.y ?? 0,
					}),
				});
				openSearchModal();
			}
		},
		[isSearchModalOpen, setNewNodeInformation, openSearchModal],
	);

	useHotkeys("ctrl+z", () => undo(), [undo]);
	useHotkeys("ctrl+shift+z, ctrl+y", () => redo(), [redo]);

	const [colorMode, setColorMode] = useState<ColorMode>("light");
	useEffect(() => {
		window.addEventListener("theme-change", ((ev: CustomEvent) =>
			setColorMode(ev.detail as ColorMode)) as EventListener);
		setColorMode(
			(localStorage.getItem(ThemeProps.KEY) as ColorMode | null) ?? "light",
		);

		const updateMousePosition = (ev: MouseEvent) => {
			mousePositionRef.current = { x: ev.clientX, y: ev.clientY };
		};
		window.addEventListener("mousemove", updateMousePosition);
		return () => window.removeEventListener("mousemove", updateMousePosition);
	}, []);

	const isValidConnection = useCallback(
		(connection: Connection | Edge) =>
			nodeSchemasCompatible(connection, nodes) &&
			!connectionHasCycles(connection, nodes, edges),
		[nodes, edges],
	);

	const proxyOnConnectEnd = useCallback(
		(event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
			onConnectEnd(
				event,
				connectionState,
				screenToFlowPosition,
				openSearchModal,
			);
		},
		[onConnectEnd, screenToFlowPosition, openSearchModal],
	);

	const layoutNodes = useCallback(() => {
		const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
		g.setGraph({ rankdir: "LR" });

		for (const e of edges) g.setEdge(e.source, e.target);
		for (const n of nodes) {
			g.setNode(n.id, {
				...n,
				width: n.measured?.width ?? 0,
				height: n.measured?.height ?? 0,
			});
		}
		dagre.layout(g);

		setNodes(
			nodes.map((n) => {
				const position = g.node(n.id);
				const x = position.x - (n.measured?.width ?? 0) / 2;
				const y = position.y - (n.measured?.height ?? 0) / 2;
				return { ...n, position: { x, y } };
			}),
		);

		fitView();
	}, [nodes, edges, fitView, setNodes]);

	useEffect(() => {
		if (nodesInitialized && !nodesLaidOut.current) {
			nodesLaidOut.current = true;
			(useProjectStore.getState().loaded ? fitView : layoutNodes)();
		}
	}, [nodesInitialized, fitView, layoutNodes]);

	const onNodeContextMenu = useCallback(
		(ev: ReactMouseEvent, node: ProjectNode) => {
			ev.preventDefault();
			contextMenuRef.current.trigger(node, { x: ev.clientX, y: ev.clientY });
		},
		[],
	);

	return (
		<div ref={containerRef} className="w-full h-full">
			<ReactFlow
				nodes={nodes}
				nodeTypes={nodeRenderers}
				edges={edges}
				proOptions={{ hideAttribution: true }}
				colorMode={colorMode}
				deleteKeyCode={["Delete", "Backspace"]}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onConnectEnd={proxyOnConnectEnd}
				onReconnect={onReconnect}
				onReconnectStart={onReconnectStart}
				onReconnectEnd={onReconnectEnd}
				onNodesDelete={onNodesDelete}
				onEdgesDelete={onEdgesDelete}
				onNodeContextMenu={onNodeContextMenu}
				isValidConnection={isValidConnection}
			>
				<Controls />
				<Background size={2} />
				<Panel position="top-left">
					<div className="flex flex-row gap-2">
						<NestedDropdown
							trigger={
								<Button
									isIconOnly
									startContent={<Icon width={18} icon="mdi:dots-vertical" />}
								/>
							}
							items={[
								{
									key: "layout-nodes",
									label: <Trans>layout nodes</Trans>,
									startContent: <Icon width={18} icon="mdi:stars" />,
									onPress: layoutNodes,
								},
								{
									key: "export-project",
									label: <Trans>export project...</Trans>,
									startContent: <Icon width={18} icon="mdi:download" />,
									onPress: openExportProjectModal,
								},
							]}
						/>
						<Tooltip
							delay={500}
							content={
								<div className="flex flex-row items-center justify-center gap-2 p-1">
									<Trans>undo</Trans>
									<Kbd keys={["ctrl"]}>Z</Kbd>
								</div>
							}
						>
							<Button
								onPress={() => undo()}
								isIconOnly
								isDisabled={pastStates.length === 0}
								startContent={<Icon width={18} icon="mdi:undo" />}
							/>
						</Tooltip>
						<Tooltip
							delay={500}
							content={
								<div className="flex flex-row items-center justify-center gap-2 p-1">
									<Trans>redo</Trans>
									<Kbd keys={["ctrl", "shift"]}>Z</Kbd>
								</div>
							}
						>
							<Button
								onPress={() => redo()}
								isIconOnly
								isDisabled={futureStates.length === 0}
								startContent={<Icon width={18} icon="mdi:redo" />}
							/>
						</Tooltip>
					</div>
				</Panel>
				<Panel position="bottom-right">
					<div className="flex flex-row gap-2">
						<Button
							size="lg"
							className="items-center gap-2 text-lg"
							color="primary"
							variant="shadow"
							endContent={<Icon width={20} icon="mdi:arrow-right" />}
							onPress={async () => {
								useProjectStore.getState().collectNodes();
								await useProjectStore.getState().collectIntegrations();
								useFormatEditorWrapperStore
									.getState()
									.setState(FormatEditorWrapperState.OUT);
							}}
						>
							<Trans>done</Trans>
						</Button>
					</div>
				</Panel>
			</ReactFlow>
			<SearchNodesModal
				portal={containerRef}
				isOpen={isSearchModalOpen}
				onOpenChange={onSearchModalOpenChange}
			/>
			<ExportProjectModal
				isOpen={isExportProjectModalOpen}
				onOpenChange={onExportProjectModalOpenChange}
				onClose={onExportProjectModalClose}
			/>
			<FormatEditorContextMenu ref={contextMenuRef} />
		</div>
	);
}
