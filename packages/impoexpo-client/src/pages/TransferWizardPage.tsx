import ColumnSteps from "@/components/external/ColumnStep";
import SelectSourceCard from "@/features/transfer-wizard/select-source-card/SelectSourceCard";
import FormatEditor from "@/features/format-editor/FormatEditor";
import { WIZARD_STORE_CATEGORY, resetStores } from "@/stores/resettable";
import {
	FormatEditorWrapperState,
	TransferWizardStage,
	useFormatEditorWrapperStore,
	useTransferWizardStore,
} from "@/features/transfer-wizard/store";
import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans, useLingui } from "@lingui/react/macro";
import { ReactFlowProvider } from "@xyflow/react";
import { motion, useAnimate } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { useNavigate } from "react-router";
import {
	clearStatesFromDatabase,
	loadStatesFromDatabase,
	saveStatesToDatabase,
} from "@/db/persisted";
import { useQuery } from "@tanstack/react-query";
import {
	importBuiltinNodes,
	importIntegrationNodes,
} from "../features/format-editor/nodes/renderable-node-database";
import { initializeNodes } from "@impoexpo/shared/nodes/node-database";
import TransferProgressCard from "../features/transfer-wizard/transfer-progress-card/TransferProgressCard";
import SwitchesPanel from "@/components/buttons/SwitchesPanel";
import { getLocalProject } from "@/db/local-projects";
import { applyProjectSnapshot } from "@/db/snapshot";
import { allIntegrations } from "@/integrations/integrations";
import { useProjectStore } from "@/stores/project";

const AnimatedCard = motion.create(Card);
export default function TransferWizardPage() {
	const importNodesQuery = useQuery({
		queryKey: ["import-nodes"],
		queryFn: async () => {
			await importBuiltinNodes();
			await importIntegrationNodes();
			initializeNodes();
			return true;
		},
		refetchOnWindowFocus: false,
	});
	const importNodesSuccessful = importNodesQuery.data;
	if (importNodesQuery.error) console.error(importNodesQuery.error);

	const loadPersistentDataQuery = useQuery({
		queryKey: ["load-persistent-data"],
		queryFn: async () => {
			await Promise.all(
				Object.values(
					import.meta.glob([
						"../integrations/**/integration.ts",
						"../integrations/**/integration.tsx",
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
		console.error(loadPersistentDataQuery.error);
	}

	const navigate = useNavigate();
	const { t } = useLingui();
	const { stage, setStage } = useTransferWizardStore();

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
					</FormatEditorWrapper>
				);
			case TransferWizardStage.TRANSFER:
				return <TransferProgressCard />;
		}
	};

	return (
		<div className="flex flex-row items-center justify-start w-screen h-screen gap-4 p-6">
			<AnimatedCard
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="h-full flex-[1] p-2"
			>
				<CardHeader className="flex flex-row gap-3 pl-4 font-medium text-large">
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
					<Trans>new data transfer</Trans>
				</CardHeader>
				<CardBody>
					<ColumnSteps
						currentStep={stage}
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
							{ title: t`done!` },
						]}
						onStepChange={(idx) => setStage(idx as TransferWizardStage)}
					/>
				</CardBody>
				<CardFooter className="flex flex-row items-center gap-2">
					<SwitchesPanel />
				</CardFooter>
			</AnimatedCard>
			<motion.div
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="flex justify-center items-center flex-[3] h-full"
			>
				{getStageWidget()}
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
						ease: [0.83, 0, 0.17, 1],
						duration: 0.5,
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
					className="absolute w-full h-full bg-content1 pointer-events-none"
				/>
			</AnimatedCard>
		)
	);
}
