import LanguageSwitcher from "@/components/buttons/LanguageSwitcher";
import ThemeSwitcher from "@/components/buttons/ThemeSwitcher";
import ColumnSteps from "@/components/external/ColumnStep";
import SelectSourceCard from "@/features/transfer-wizard/select-source-card/SelectSourceCard";
import FormatEditor from "@/features/format-editor/FormatEditor";
import { WIZARD_STORE_CATEGORY, resetStores } from "@/stores/resettable";
import {
	TransferWizardStage,
	useTransferWizardStore,
} from "@/features/transfer-wizard/store";
import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	CircularProgress,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans, useLingui } from "@lingui/react/macro";
import { ReactFlowProvider } from "@xyflow/react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
	clearStatesFromDatabase,
	loadStatesFromDatabase,
	saveStatesToDatabase,
} from "@/db/persisted";
import { useQuery } from "@tanstack/react-query";
import { importBuiltinNodes } from "../format-editor/nodes/renderable-node-database";
import { initializeNodes } from "@impoexpo/shared/nodes/node-database";
import TransferProgressCard from "./transfer-progress-card/TransferProgressCard";

const AnimatedCard = motion.create(Card);
export default function TransferWizardPage() {
	const importNodesQuery = useQuery({
		queryKey: ["import-nodes"],
		queryFn: async () => {
			await importBuiltinNodes();
			initializeNodes();
			return true;
		},
	});
	const importNodesSuccessful = importNodesQuery.data;
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
			await loadStatesFromDatabase();
			return true;
		},
		enabled: !!importNodesSuccessful,
	});

	const navigate = useNavigate();
	const { t } = useLingui();
	const { stage, setStage } = useTransferWizardStore();
	const [showBlockerContainer, setShowBlockerContainer] =
		useState<boolean>(true);
	const [reverseBlockerContainer, setReverseBlockerContainer] =
		useState<boolean>(false);

	useEffect(() => {
		window.addEventListener("beforeunload", saveStatesToDatabase);
		return () =>
			window.removeEventListener("beforeunload", saveStatesToDatabase);
	}, []);

	const onFormatEditorClosedCallback = useCallback(() => {
		setReverseBlockerContainer(true);
		setShowBlockerContainer(true);
	}, []);

	const getStageWidget = () => {
		if (loadPersistentDataQuery.isLoading || importNodesQuery.isLoading) {
			return (
				<Card>
					<CardBody>
						<CircularProgress />
					</CardBody>
				</Card>
			);
		}

		switch (stage) {
			case TransferWizardStage.SELECT_SOURCE:
				return <SelectSourceCard />;
			case TransferWizardStage.FORMAT:
				return (
					<Card className="relative flex items-center justify-center w-full h-full">
						<ReactFlowProvider>
							<FormatEditor doneCallback={onFormatEditorClosedCallback} />
						</ReactFlowProvider>
						{showBlockerContainer && (
							<AnimatedCard
								transition={{
									delay: 0.25,
									ease: [0.83, 0, 0.17, 1],
									duration: 0.5,
								}}
								initial={{ opacity: reverseBlockerContainer ? 0 : 1 }}
								animate={{ opacity: reverseBlockerContainer ? 1 : 0 }}
								onAnimationComplete={() => {
									if (reverseBlockerContainer) {
										setTimeout(
											() => setStage(TransferWizardStage.TRANSFER),
											250,
										);
									} else setShowBlockerContainer(false);
								}}
								className="absolute w-full h-full bg-content1"
							/>
						)}
					</Card>
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
								description: t`where should we read from and where should we write to?`,
							},
							{ title: t`formatting`, description: t`how should we transfer?` },
							{ title: t`transfer`, description: t`where the magic happens` },
							{ title: t`done!` },
						]}
					/>
				</CardBody>
				<CardFooter className="flex flex-row items-center gap-2">
					<ThemeSwitcher />
					<Icon icon="mdi:circle" width={6} />
					<LanguageSwitcher />
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
