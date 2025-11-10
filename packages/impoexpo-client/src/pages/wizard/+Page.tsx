import {
	addToast,
	Button,
	Card,
	CardBody,
	CardHeader,
	Code,
	Spinner,
	Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { initializeNodes } from "@impoexpo/shared/nodes/node-database";
import { Trans, useLingui } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import clsx from "clsx";
import { motion, useAnimate } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { navigate } from "vike/client/router";
import ColumnSteps from "@/components/external/ColumnStep";
import { getLocalProject } from "@/db/local-projects";
import {
	clearStatesFromDatabase,
	loadStatesFromDatabase,
	saveStatesToDatabase,
} from "@/db/persisted";
import { applyProjectSnapshot } from "@/db/snapshot";
import FormatEditor from "@/features/format-editor/FormatEditor";
import FormatEditorDebugOverlay from "@/features/format-editor/FormatEditorDebugOverlay";
import {
	importBuiltinNodes,
	importIntegrationNodes,
} from "@/features/format-editor/nodes/renderable-node-database";
import SelectSourceCard from "@/features/transfer-wizard/select-source-card/SelectSourceCard";
import {
	FormatEditorWrapperState,
	TransferWizardStage,
	useFormatEditorWrapperStore,
	useTransferWizardStore,
} from "@/features/transfer-wizard/store";
import TransferProgressCard from "@/features/transfer-wizard/transfer-progress-card/TransferProgressCard";
import { allIntegrations } from "@/integrations/integrations";
import { useProjectStore } from "@/stores/project";
import { resetStores, WIZARD_STORE_CATEGORY } from "@/stores/resettable";
import { AnimatedCard } from "@/styles/motion";

export default function Wizard() {
	const importNodesQuery = useQuery({
		queryKey: ["import-nodes"],
		queryFn: async () => {
			await importBuiltinNodes();
			await importIntegrationNodes();
			initializeNodes();
			return true;
		},
		retry: false,
		refetchOnWindowFocus: false,
	});
	const importNodesSuccessful = importNodesQuery.data;
	if (importNodesQuery.error)
		console.error("failed to load nodes", importNodesQuery.error);

	const loadPersistentDataQuery = useQuery({
		queryKey: ["load-persistent-data"],
		queryFn: async () => {
			await Promise.all(
				Object.values(
					import.meta.glob([
						"../../integrations/**/integration.ts",
						"../../integrations/**/integration.tsx",
					]),
				).map((v) => v()),
			);

			const query = new URLSearchParams(window.location.search);
			if (query.has("project")) {
				const project = await getLocalProject(query.get("project") ?? "");
				if (!project) return;
				await applyProjectSnapshot(project.snapshot);
				useProjectStore.getState().setLocalProjectId(project.id);
				for (const id of Object.keys(project.snapshot.project.integrations)) {
					const integration = allIntegrations.find((i) => i.id === id);
					if (!integration || !integration.onProjectInformationLoaded) continue;
					await integration.onProjectInformationLoaded(
						project.snapshot.project.integrations[id],
					);
				}

				window.history.replaceState(
					{},
					"",
					`${window.location.origin}${window.location.pathname}`,
				);
				setStage(TransferWizardStage.FORMAT);
				useFormatEditorWrapperStore
					.getState()
					.setState(FormatEditorWrapperState.IN);
			} else await loadStatesFromDatabase();

			return true;
		},
		refetchOnWindowFocus: false,
		enabled: !!importNodesSuccessful,
	});

	if (loadPersistentDataQuery.isError) {
		console.error(
			"failed to load persistent data",
			loadPersistentDataQuery.error,
		);
		addToast({
			color: "danger",
			title: <Trans>failed to load data from storage</Trans>,
			description: (
				<p className="font-mono">{loadPersistentDataQuery.error.message}</p>
			),
		});
	}

	const { t } = useLingui();
	const { stage, setStage, collapseSidebar, setCollapseSidebar } =
		useTransferWizardStore();

	useEffect(() => {
		window.addEventListener("beforeunload", saveStatesToDatabase);
		return () =>
			window.removeEventListener("beforeunload", saveStatesToDatabase);
	}, []);

	const getStageWidget = () => {
		if (loadPersistentDataQuery.isLoading || importNodesQuery.isLoading) {
			return (
				<Card>
					<CardBody>
						<Spinner />
					</CardBody>
				</Card>
			);
		}

		switch (stage) {
			case TransferWizardStage.SELECT_SOURCE:
				return <SelectSourceCard />;
			case TransferWizardStage.FORMAT:
				return (
					<FormatEditorWrapper
						endCallback={() => setStage(TransferWizardStage.TRANSFER)}
					>
						<ReactFlowProvider>
							<FormatEditor />
						</ReactFlowProvider>
						<FormatEditorDebugOverlay />
					</FormatEditorWrapper>
				);
			case TransferWizardStage.TRANSFER:
				return <TransferProgressCard />;
		}
	};

	return (
		<div className="flex flex-row items-center justify-start w-full gap-4">
			<AnimatedCard
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className={clsx("h-full p-2", collapseSidebar ? "shrink" : "flex-[1]")}
			>
				<CardHeader
					className={clsx(
						"flex flex-row gap-3 font-medium text-large",
						collapseSidebar ? "justify-center" : "justify-start",
					)}
				>
					<Button
						onPress={async () => {
							await clearStatesFromDatabase();
							resetStores(WIZARD_STORE_CATEGORY);
							navigate("/");
						}}
						variant="faded"
						isIconOnly
						startContent={<Icon icon="mdi:arrow-left" />}
					/>
					{!collapseSidebar && <Trans>new data transfer</Trans>}
				</CardHeader>
				<CardBody className="flex flex-col justify-between">
					<ColumnSteps
						currentStep={stage}
						collapse={collapseSidebar}
						steps={[
							{
								title: t`select sources`,
								description: t`what should we transfer?`,
							},
							{ title: t`formatting`, description: t`how should we transfer?` },
							{
								title: t`transfer`,
								description: t`where the magic happens...`,
							},
						]}
					/>
					<div
						className={clsx(
							"flex flex-row",
							collapseSidebar ? "justify-center" : "justify-start",
						)}
					>
						<Tooltip
							content={
								collapseSidebar ? t`expand sidebar` : t`collapse sidebar`
							}
						>
							<Button
								onPress={() => setCollapseSidebar(!collapseSidebar)}
								className="aspect-square"
								size="sm"
								isIconOnly
								startContent={
									<Icon
										icon={
											collapseSidebar
												? "mdi:arrow-collapse-right"
												: "mdi:arrow-collapse-left"
										}
									/>
								}
							/>
						</Tooltip>
					</div>
				</CardBody>
			</AnimatedCard>
			<motion.div
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="flex justify-center items-center flex-[3] h-full"
			>
				{importNodesQuery.error ? (
					<Card>
						<CardBody className="flex flex-col items-center gap-2">
							<Icon
								className="text-danger"
								width={48}
								icon="mdi:error-outline"
							/>
							<p className="text-foreground-500 text-center">
								<Trans>
									<span className="font-medium text-xl text-foreground">
										something went wrong while loading integrations.
									</span>
									<br />
									this is likely not your fault.
									<br />
									please check the console and contact the developers.
								</Trans>
							</p>
							<Code color="danger" className="whitespace-normal">
								{importNodesQuery.error.message}
							</Code>
						</CardBody>
					</Card>
				) : (
					getStageWidget()
				)}
			</motion.div>
		</div>
	);
}

function FormatEditorWrapper(props: {
	children: ReactNode;
	endCallback: () => void;
}) {
	const { state, setState } = useFormatEditorWrapperStore();
	const [containerScope, animateContainer] = useAnimate();
	const [overlayScope, animateOverlay] = useAnimate();

	useEffect(() => {
		switch (state) {
			case FormatEditorWrapperState.HIDDEN:
			case FormatEditorWrapperState.IDLE:
				break;
			case FormatEditorWrapperState.IN:
				animateContainer(
					containerScope.current,
					{
						width: ["2rem", "100%"],
						height: ["2rem", "100%"],
					},
					{
						times: [0, 0.4, 1],
						duration: 1.5,
						ease: [0.83, 0, 0.17, 1],
						onComplete: () => {
							queueMicrotask(() =>
								animateOverlay(
									overlayScope.current,
									{ opacity: 0 },
									{
										delay: 0.25,
										ease: [0.83, 0, 0.17, 1],
										duration: 0.5,
									},
								),
							);
							setState(FormatEditorWrapperState.IDLE);
						},
					},
				);
				break;
			case FormatEditorWrapperState.OUT:
				animateOverlay(
					overlayScope.current,
					{ opacity: 1 },
					{
						delay: 0.25,
						onComplete: props.endCallback,
					},
				);
				break;
		}
	}, [
		state,
		setState,
		containerScope,
		overlayScope,
		animateContainer,
		animateOverlay,
		props.endCallback,
	]);

	return (
		state !== FormatEditorWrapperState.HIDDEN && (
			<AnimatedCard
				style={{ width: "0px", height: "0px" }}
				ref={containerScope}
			>
				{state !== FormatEditorWrapperState.IN && props.children}
				<AnimatedCard
					ref={overlayScope}
					style={{ opacity: 1 }}
					className="absolute w-full h-full pointer-events-none bg-content1"
				/>
			</AnimatedCard>
		)
	);
}
