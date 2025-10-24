import { useMemo, useState } from "react";
import {
	BaseEdge,
	EdgeLabelRenderer,
	getBezierPath,
	type EdgeProps,
} from "@xyflow/react";
import { useFormatEditorStore } from "./stores/store";
import { createCompleteConverter } from "@impoexpo/shared/nodes/type-converters";
import { motion } from "motion/react";
import {
	Card,
	CardBody,
	Checkbox,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans, useLingui } from "@lingui/react/macro";
import { useShallow } from "zustand/react/shallow";
import { entriesCompatible } from "@impoexpo/shared/nodes/node-utils";
import { schemaToString } from "@impoexpo/shared/nodes/schema-string-conversions";
import { getNodeEntry, updateNodeEntryProperty } from "./stores/node-entries";
const AnimatedCard = motion.create(Card);

export default function TypeHelperEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	source,
	target,
	sourceHandleId,
	targetHandleId,
	markerEnd,
}: EdgeProps) {
	const { t } = useLingui();
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});
	const [getBaseNodeFromId, fromNode, toNode] = useFormatEditorStore(
		useShallow((selector) => [
			selector.getBaseNodeFromId,
			selector.nodes.find((n) => n.id === source),
			selector.nodes.find((n) => n.id === target),
		]),
	);

	const [errorMessagePopoverOpen, setErrorMessagePopoverOpen] = useState(false);
	const sourceEntry = useMemo(
		() => fromNode?.data.entries?.[sourceHandleId ?? ""],
		[fromNode, sourceHandleId],
	);
	const errorMessage = useMemo(
		() =>
			sourceEntry && "errorBehavior" in sourceEntry
				? (sourceEntry.errorBehavior?.message ?? "")
				: "",
		[sourceEntry],
	);
	const skipIterationInsideLoops = useMemo(
		() =>
			sourceEntry && "errorBehavior" in sourceEntry
				? (sourceEntry.errorBehavior?.skipIterationInsideLoops ?? false)
				: false,
		[sourceEntry],
	);

	const converterIsFaulty = useMemo(() => {
		if (!sourceHandleId || !targetHandleId) return false;
		const sourceEntry = getBaseNodeFromId(source)?.entry(sourceHandleId);
		if (!sourceEntry) return false;
		const targetEntry = getBaseNodeFromId(target)?.entry(targetHandleId);
		if (!targetEntry) return false;
		try {
			if (!entriesCompatible(sourceEntry, targetEntry, true))
				throw new Error(
					`a type helper edge cannot be used with incompatible types ${schemaToString(sourceEntry.schema)} and ${schemaToString(targetEntry.schema)}`,
				);
			return createCompleteConverter(sourceEntry.schema, targetEntry.schema)
				.faulty;
		} catch (err) {
			console.warn(err);
			return undefined;
		}
	}, [getBaseNodeFromId, source, target, sourceHandleId, targetHandleId]);

	return (
		<>
			<BaseEdge path={edgePath} markerEnd={markerEnd} />
			{converterIsFaulty !== undefined && (
				<EdgeLabelRenderer>
					{converterIsFaulty && (
						<div
							className="nodrag nopan pointer-events-auto absolute w-fit h-fit"
							style={{
								transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
							}}
						>
							<Popover
								isOpen={errorMessagePopoverOpen}
								onOpenChange={setErrorMessagePopoverOpen}
							>
								<PopoverTrigger>
									<AnimatedCard
										isPressable
										initial={{
											opacity: 0,
											y: 10,
										}}
										animate={{
											opacity: 1,
											y: 0,
										}}
									>
										<Tooltip
											content={
												<p className="text-center w-fit text-small">
													<Trans>
														the conversion between these types may result in an
														error.
														<br />
														click the button to edit the error message.
													</Trans>
												</p>
											}
										>
											<CardBody className="p-2">
												<Icon
													width={24}
													className={
														errorMessage !== "" || skipIterationInsideLoops
															? "text-default"
															: "text-warning"
													}
													icon={
														errorMessage !== "" || skipIterationInsideLoops
															? "mdi:pencil"
															: "mdi:alert"
													}
												/>
											</CardBody>
										</Tooltip>
									</AnimatedCard>
								</PopoverTrigger>
								<PopoverContent className="flex flex-col p-3 gap-2">
									<Input
										autoFocus
										value={errorMessage}
										onValueChange={(v) =>
											updateNodeEntryProperty(
												source,
												sourceHandleId ?? "",
												"errorBehavior",
												{
													message: v,
													skipIterationInsideLoops:
														getNodeEntry(source, sourceHandleId ?? "")
															?.errorBehavior?.skipIterationInsideLoops ??
														false,
												},
											)
										}
										onKeyDown={(ev) => {
											if (ev.key === "Enter") setErrorMessagePopoverOpen(false);
										}}
										placeholder={t`enter the error message...`}
									/>
									<Checkbox
										isSelected={skipIterationInsideLoops}
										onValueChange={(v) => {
											updateNodeEntryProperty(
												source,
												sourceHandleId ?? "",
												"errorBehavior",
												{
													message:
														getNodeEntry(source, sourceHandleId ?? "")
															?.errorBehavior?.message ?? "",
													skipIterationInsideLoops: v,
												},
											);
										}}
									>
										<p className="text-small">
											<Trans>
												inside loops, skip an iteration instead of erroring
											</Trans>
										</p>
									</Checkbox>
								</PopoverContent>
							</Popover>
						</div>
					)}
				</EdgeLabelRenderer>
			)}
		</>
	);
}
