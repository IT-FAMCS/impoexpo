import { Background, Controls, ReactFlow } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

export default function FormatEditor() {
	return (
		<div className="w-full h-full">
			<ReactFlow proOptions={{ hideAttribution: true }}>
				<Controls showFitView={false} />
				<Background size={2} />
			</ReactFlow>
		</div>
	);
}
