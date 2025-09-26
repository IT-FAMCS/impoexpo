import {
	Accordion,
	AccordionItem,
	Alert,
	Button,
	Card,
	CardBody,
	Code,
	Listbox,
	ListboxItem,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ScrollShadow,
	Spinner,
	Tooltip,
	useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useLingui, Trans } from "@lingui/react/macro";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
	getAllLocalProjects,
	removeLocalProject,
	type LocalProjectsTableEntry,
} from "@/db/local-projects";
import { TransferHandler, TransferHandlerState } from "@/api/TransferHandler";
import { RETRIEVE_PROJECT_OUTPUT_ROUTE } from "@impoexpo/shared/schemas/project/static";
import { route } from "@/api/common";
import prettyBytes from "pretty-bytes";
import type { ProjectStatusNotification } from "@impoexpo/shared/schemas/project/ProjectStatusSchemas";
import { deepCopy } from "deep-copy-ts";
import DividerWithText from "../external/DividerWithText";
import clsx from "clsx";
import { localizableString } from "@/features/format-editor/nodes/renderable-node-types";
import { AnimatePresence, motion } from "motion/react";
import { navigate } from "vike/client/router";

export default function LocalProjectsManagerModal(props: {
	trigger?: (onOpen: () => void) => ReactNode;
}) {
	const { isOpen, onOpen, onOpenChange } = useDisclosure({
		id: "LOCAL_PROJECTS_MANAGER_MODAL",
	});
	const [projects, setProjects] = useState<
		Record<string, LocalProjectsTableEntry[]>
	>({});
	useEffect(() => {
		getAllLocalProjects().then((ungroupedProjects) => {
			const groupedProjects: Record<string, LocalProjectsTableEntry[]> = {};
			for (const project of ungroupedProjects) {
				const group = project.group ?? "";
				if (group in groupedProjects) groupedProjects[group].push(project);
				else groupedProjects[group] = [project];
			}
			setProjects(groupedProjects);
		});
	}, []);

	return (
		<>
			{props.trigger?.(onOpen)}
			<Modal
				scrollBehavior="inside"
				isOpen={isOpen}
				onOpenChange={onOpenChange}
			>
				<ModalContent>
					{() => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<Trans>projects</Trans>
							</ModalHeader>
							<ModalBody className="flex flex-col items-center justify-center gap-4">
								{Object.keys(projects).length === 0 ? (
									<>
										<Icon
											width={48}
											className="-mb-2 text-foreground-500"
											icon="mdi:emoticon-sad-outline"
										/>
										<p className="text-center text-foreground-500">
											<Trans>
												you currently have no saved projects.
												<br />
												go create one!
											</Trans>
										</p>
									</>
								) : (
									<ScrollShadow className="w-full p-1 max-h-[75vh] no-scrollbar flex flex-col gap-4">
										{Object.entries(projects).map((pair) => (
											<div key={pair[0]} className="flex flex-col w-full">
												{pair[0] !== "" && (
													<DividerWithText>{pair[0]}</DividerWithText>
												)}
												{pair[1].map((p) => (
													<LocalProjectCard
														key={p.id}
														className="mt-2"
														project={p}
														onDelete={async () => {
															await removeLocalProject(p.id);

															const group = p.group ?? "";
															const copy = deepCopy(projects);
															copy[group] = copy[group].filter(
																(op) => op.id !== p.id,
															);
															if (copy[group].length === 0) delete copy[group];

															setProjects(copy);
														}}
													/>
												))}
											</div>
										))}
									</ScrollShadow>
								)}
							</ModalBody>
							<ModalFooter />
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}

function LocalProjectCard(props: {
	project: LocalProjectsTableEntry;
	onDelete: () => void;
	className?: string;
}) {
	const { t } = useLingui();
	const [deleting, setDeleting] = useState(false);
	const [running, setRunning] = useState(false);

	const [handler, setHandler] = useState<TransferHandler>();
	const [handlerState, setHandlerState] = useState<TransferHandlerState>(
		TransferHandlerState.IDLE,
	);

	const convertColor = (
		notificationType: ProjectStatusNotification["type"],
	) => {
		switch (notificationType) {
			case "error":
				return "danger";
			case "info":
				return "primary";
			case "warn":
				return "warning";
			case "debug":
				return "default";
		}
	};

	const run = useCallback(() => {
		if (running) return;

		const handler = new TransferHandler(props.project.snapshot.project);
		handler.addEventListener("state-changed", (state) => {
			if (
				state === TransferHandlerState.DONE ||
				state === TransferHandlerState.TERMINATED
			)
				setRunning(false);
			setHandlerState(state);
		});
		handler.start();

		setRunning(true);
		setHandler(handler);
	}, [running, props.project]);

	const stateString = useMemo(() => {
		switch (handlerState) {
			case TransferHandlerState.IDLE:
				return t`preparing`;
			case TransferHandlerState.UPLOADING_PROJECT:
				return t`uploading the project`;
			case TransferHandlerState.UPLOADING_PROJECT_FILES:
				return t`uploading project files`;
			case TransferHandlerState.CONNECTING:
				return t`connecting to the server`;
			case TransferHandlerState.CONNECTED:
				return t`transferring`;
			case TransferHandlerState.RECONNECTING:
				return t`reconnecting to the server`;
			case TransferHandlerState.DONE:
				return t`done!`;
			case TransferHandlerState.TERMINATED:
				return t`an error occurred`;
		}
	}, [handlerState, t]);

	return (
		<Card shadow="sm" className={clsx("w-full", props.className)}>
			<CardBody className="flex flex-col gap-2 px-4 py-4">
				<div className="flex flex-row items-center gap-2">
					<Card>
						<CardBody className="p-2">
							<Icon width={24} icon="mdi:swap-horizontal-bold" />
						</CardBody>
					</Card>
					<div className="flex flex-col gap-2">
						<p className="overflow-hidden text-ellipsis text-nowrap">
							{props.project.name}
						</p>
						<p className="-mt-2 text-tiny text-foreground-300">
							id: {props.project.id}
						</p>
					</div>
				</div>
				<div className="flex flex-row items-center gap-2">
					<Tooltip content={t`edit project`}>
						<Button
							color="primary"
							size="sm"
							isIconOnly
							startContent={<Icon width={18} icon="mdi:pencil" />}
							onPress={() => navigate(`/wizard?project=${props.project.id}`)}
						/>
					</Tooltip>
					<Tooltip content={t`delete project`}>
						<Button
							disabled={deleting}
							onPress={() => setDeleting(true)}
							color="danger"
							size="sm"
							isIconOnly
							startContent={<Icon width={18} icon="mdi:trash-can" />}
						/>
					</Tooltip>
					<Tooltip content={t`run project`}>
						<Button
							color="success"
							size="sm"
							isIconOnly
							onPress={run}
							disabled={running}
							startContent={
								running ? (
									<Spinner color="white" size="sm" />
								) : handler?.state === TransferHandlerState.DONE ? (
									<Icon className="text-white" width={24} icon="mdi:check" />
								) : handler?.state === TransferHandlerState.TERMINATED ? (
									<Icon className="text-white" width={24} icon="mdi:close" />
								) : (
									<Icon
										className="text-white"
										width={24}
										icon="mdi:chevron-right"
									/>
								)
							}
						/>
					</Tooltip>
					{handler ? (
						<p className="ml-1 text-sm text-foreground-500">{stateString}</p>
					) : null}
				</div>
				<AnimatePresence>
					{handler?.state === TransferHandlerState.TERMINATED ? (
						<motion.div
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							key="termination-explanation"
						>
							<Code color="danger" className="whitespace-normal">
								<span className="text-lg">
									<b>
										{localizableString(
											handler.terminationReason?.short ?? "",
											t,
										)}
									</b>
								</span>
								<br />
								{handler.terminationReason?.technical}
							</Code>
						</motion.div>
					) : null}
					{deleting && (
						<motion.div
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							key="confirm-deletion"
						>
							<Alert
								color="danger"
								endContent={
									<div className="flex flex-row gap-2">
										<Button onPress={props.onDelete} color="danger">
											<Trans>yes</Trans>
										</Button>
										<Button
											onPress={() => setDeleting(false)}
											color="success"
											className="text-white"
										>
											<Trans>no</Trans>
										</Button>
									</div>
								}
								title={<Trans>are you sure?</Trans>}
							/>
						</motion.div>
					)}
					{handler?.state === TransferHandlerState.DONE ? (
						handler.outputs.length === 0 ? (
							<motion.div
								initial={{ opacity: 0, y: 15 }}
								animate={{ opacity: 1, y: 0 }}
								key="no-outputs-card"
							>
								<Card>
									<CardBody>
										<p className="text-center text-foreground-500">
											<Trans>this transfer produced no files</Trans>
										</p>
									</CardBody>
								</Card>
							</motion.div>
						) : (
							<motion.div
								initial={{ opacity: 0, y: 15 }}
								animate={{ opacity: 1, y: 0 }}
								key="outputs-card"
							>
								<Listbox selectionMode="none" items={handler.outputs}>
									{(item) => (
										<ListboxItem
											className="ring-2 ring-foreground-100"
											startContent={
												<Icon width={24} icon="mdi:file-document" />
											}
											endContent={
												<Button
													size="sm"
													color="primary"
													isIconOnly
													startContent={<Icon width={18} icon="mdi:download" />}
													onPress={() => {
														window.location.href = route(
															`${RETRIEVE_PROJECT_OUTPUT_ROUTE}/${item.identifier}`,
														).href;
													}}
												/>
											}
											key={item.identifier}
											title={item.name}
											description={prettyBytes(item.size)}
										/>
									)}
								</Listbox>
							</motion.div>
						)
					) : null}
					{handler?.state === TransferHandlerState.DONE ? (
						<motion.div
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							key="notifications-accordion"
						>
							<Accordion itemClasses={{ trigger: "py-0" }} className="px-1">
								<AccordionItem
									className="w-full p-2 px-4 ring-2 ring-foreground-100 rounded-small"
									key="notifications"
									aria-label={t`notifications`}
									title={t`notifications`}
								>
									<ScrollShadow className="max-h-[25vh]">
										<div className="flex flex-col gap-2">
											{handler.notifications.map((n, idx) => (
												// biome-ignore lint/suspicious/noArrayIndexKey: who cares
												<Alert key={idx} color={convertColor(n.type)}>
													{n.message}
												</Alert>
											))}
										</div>
									</ScrollShadow>
								</AccordionItem>
							</Accordion>
						</motion.div>
					) : null}
				</AnimatePresence>
			</CardBody>
		</Card>
	);
}
