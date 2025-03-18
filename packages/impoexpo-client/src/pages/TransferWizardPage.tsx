import ColumnSteps from "@/components/external/ColumnStep";
import SelectSourceCard from "@/components/wizard/SelectSourceCard";
import FormatEditor from "@/features/format-editor/FormatEditor";
import { useAuthStore } from "@/stores/auth";
import { resetStores, WIZARD_STORE_CATEGORY } from "@/stores/resettable";
import { useSourceCardStore } from "@/stores/select-source-card";
import { TransferWizardStage, useTransferWizardStore } from "@/stores/wizard";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";

const AnimatedCard = motion.create(Card);

export default function TransferWizardPage() {
	const navigate = useNavigate();
	const { stage } = useTransferWizardStore();
	// biome-ignore lint/style/noNonNullAssertion: required here
	const [showBlockerContainer, setShowBlockerContainer] =
		useState<boolean>(true);

	const getStageWidget = () => {
		switch (stage) {
			case TransferWizardStage.SELECT_SOURCE:
				return <SelectSourceCard />;
			case TransferWizardStage.FORMAT:
				return (
					<Card className="flex items-center justify-center w-full h-full relative">
						<FormatEditor />
						{/* TODO: refactor this later */}
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
								className="absolute w-full h-full bg-background"
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
					новый перенос данных
				</CardHeader>
				<CardBody>
					<ColumnSteps
						currentStep={stage}
						steps={[
							{
								title: "выбор источников",
								description: "откуда и куда переносим",
							},
							{ title: "форматирование", description: "как переносим?" },
							{ title: "перенесение", description: "where the magic happens" },
							{ title: "готово!" },
						]}
					/>
				</CardBody>
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
