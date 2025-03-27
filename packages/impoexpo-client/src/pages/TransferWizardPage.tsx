import LanguageSwitcher from "@/components/buttons/LanguageSwitcher";
import ThemeSwitcher from "@/components/buttons/ThemeSwitcher";
import ColumnSteps from "@/components/external/ColumnStep";
import SelectSourceCard from "@/components/wizard/SelectSourceCard";
import FormatEditor from "@/features/format-editor/FormatEditor";
import { resetStores, WIZARD_STORE_CATEGORY } from "@/stores/resettable";
import { TransferWizardStage, useTransferWizardStore } from "@/stores/wizard";
import { Button, Card, CardBody, CardFooter, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";
import { initializeNodes } from "@impoexpo/shared/nodes/node-utils";
import { Trans, useLingui } from "@lingui/react/macro";
import { ReactFlowProvider } from "@xyflow/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const AnimatedCard = motion.create(Card);

export default function TransferWizardPage() {
	const navigate = useNavigate();
	const { t } = useLingui();
	const { stage } = useTransferWizardStore();
	const [showBlockerContainer, setShowBlockerContainer] =
		useState<boolean>(true);

	useEffect(() => {
		if (stage === TransferWizardStage.FORMAT) initializeNodes();
	}, [stage]);

	const getStageWidget = () => {
		switch (stage) {
			case TransferWizardStage.SELECT_SOURCE:
				return <SelectSourceCard />;
			case TransferWizardStage.FORMAT:
				return (
					<Card className="relative flex items-center justify-center w-full h-full">
						<ReactFlowProvider>
							<FormatEditor />
						</ReactFlowProvider>
						{showBlockerContainer && (
							<motion.div
								transition={{
									delay: 0.25,
									ease: [0.83, 0, 0.17, 1],
									duration: 0.5,
								}}
								initial={{ opacity: 1 }}
								animate={{ opacity: 0 }}
								onAnimationComplete={() => setShowBlockerContainer(false)}
								className="absolute w-full h-full bg-content1"
							/>
						)}
					</Card>
				);
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
						onPress={() => {
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
