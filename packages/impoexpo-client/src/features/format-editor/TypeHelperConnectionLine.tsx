import { Card, CardBody, Code } from "@heroui/react";
import {
	ConnectionLineComponentProps,
	EdgeLabelRenderer,
	getBezierPath,
	useConnection,
} from "@xyflow/react";

import { getNodeRenderOptions } from "./nodes/renderable-node-database";
import { useFormatEditorStore } from "./stores/store";
import { schemasConvertible } from "@impoexpo/shared/nodes/type-converters";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import {
	entriesCompatible,
	isGeneric,
	isUnionOrEqual,
} from "@impoexpo/shared/nodes/node-utils";
import { motion } from "motion/react";
const AnimatedCard = motion.create(Card);

export default function TypeHelperConnectionLine() {
	const {
		from,
		to,
		fromPosition,
		toPosition,
		fromHandle,
		fromNode,
		toHandle,
		toNode,
		isValid,
	} = useConnection();
	const { getBaseNodeFromId } = useFormatEditorStore();

	const fromRenderOptions = (() => {
		if (!fromNode?.id) return null;
		const base = getBaseNodeFromId(fromNode.id);
		if (!base) return null;
		return getNodeRenderOptions(`${base.category}-${base.name}`);
	})();

	const toRenderOptions = (() => {
		if (!toNode?.id) return null;
		const base = getBaseNodeFromId(toNode.id);
		if (!base) return null;
		return getNodeRenderOptions(`${base.category}-${base.name}`);
	})();

	const fromEntry = (() => {
		if (!fromNode?.id || !fromHandle?.id) return;
		const base = getBaseNodeFromId(fromNode.id);
		if (!base) return null;
		return base.entry(fromHandle.id);
	})();

	const toEntry = (() => {
		if (!toNode?.id || !toHandle?.id) return;
		const base = getBaseNodeFromId(toNode.id);
		if (!base) return null;
		return base.entry(toHandle.id);
	})();

	const convertible = () => {
		if (!fromEntry || !toEntry) return false;
		return entriesCompatible(
			fromEntry.source === "output" ? fromEntry : toEntry,
			toEntry.source === "input" ? toEntry : fromEntry,
			true,
		);
	};

	if (!from || !fromPosition) return;
	const [path, labelX, labelY, offsetX, offsetY] = getBezierPath({
		sourceX: from.x,
		sourceY: from.y,
		sourcePosition: fromPosition,
		targetX: to.x,
		targetY: to.y,
		targetPosition: toPosition,
	});

	return (
		<>
			<path
				d={path}
				fill="none"
				className="animated react-flow__connection-path"
			/>
			<EdgeLabelRenderer>
				{fromEntry && toEntry && (
					<div
						className="absolute flex items-center justify-center nodrag nopan w-fit h-fit"
						style={{
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						}}
					>
						<AnimatedCard
							initial={{
								opacity: 0,
								y: 10,
							}}
							animate={{
								opacity: 1,
								y: 0,
							}}
							className="max-w-[75%]"
						>
							<CardBody className="flex flex-col items-center justify-center overflow-hidden">
								{fromEntry.source !== toEntry.source &&
								fromNode.id !== toNode?.id ? (
									<>
										<Icon
											width={36}
											icon={convertible() ? "mdi:check" : "mdi:close"}
											className={convertible() ? "text-success" : "text-danger"}
										></Icon>

										{!convertible() && (
											<p className="text-center text-foreground-500 text-tiny">
												<Trans>no conversion exists between these types</Trans>
											</p>
										)}
										{convertible() &&
											!isUnionOrEqual(fromEntry.schema, toEntry.schema) && (
												<p className="text-center text-foreground-500 text-tiny">
													<Trans>
														the value will be automatically converted
													</Trans>
												</p>
											)}
									</>
								) : (
									<>
										<Icon
											width={36}
											icon={"mdi:close"}
											className={"text-danger"}
										></Icon>
										<p className="text-center text-foreground-500 text-tiny">
											{fromNode.id === toNode?.id ? (
												<Trans>
													cannot connect properties of the same node
												</Trans>
											) : (
												<Trans>
													cannot connect properties of the same source
													<br />
													(input with input, output with output)
												</Trans>
											)}
										</p>
									</>
								)}
							</CardBody>
						</AnimatedCard>
					</div>
				)}
			</EdgeLabelRenderer>
			<EdgeLabelRenderer>
				{fromRenderOptions && fromHandle?.id && (
					<div
						className="absolute nodrag nopan w-fit h-fit"
						style={{
							transform: `translate(-50%, -50%) translate(${from.x}px,${from.y - 25}px)`,
						}}
					>
						<AnimatedCard
							initial={{
								opacity: 0,
								y: 10,
							}}
							animate={{
								opacity: 1,
								y: 0,
							}}
						>
							<CardBody className="p-0">
								<Code>{fromRenderOptions.type(fromHandle.id)}</Code>
							</CardBody>
						</AnimatedCard>
					</div>
				)}
			</EdgeLabelRenderer>

			<EdgeLabelRenderer>
				{toRenderOptions && toHandle?.id && fromNode.id !== toNode?.id && (
					<div
						className="absolute nodrag nopan w-fit h-fit"
						style={{
							transform: `translate(-50%, -50%) translate(${to.x}px,${to.y - 25}px)`,
						}}
					>
						<AnimatedCard
							initial={{
								opacity: 0,
								y: 10,
							}}
							animate={{
								opacity: 1,
								y: 0,
							}}
						>
							<CardBody className="p-0">
								<Code>{toRenderOptions.type(toHandle.id)}</Code>
							</CardBody>
						</AnimatedCard>
					</div>
				)}
			</EdgeLabelRenderer>
		</>
	);
}
