import ColumnSteps from "@/components/external/ColumnStep";
import SelectSourceCard from "@/components/wizard/SelectSourceCard";
import { useSourceCardStore } from "@/stores/select-source-card";
import { TransferWizardStage, useTransferWizardStore } from "@/stores/wizard";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

const AnimatedCard = motion.create(Card);

export default function TransferWizardPage() {
	const navigate = useNavigate();
	const { stage, setStage } = useTransferWizardStore();
	const { reset: resetSourceCardStore } = useSourceCardStore();

	const getStageWidget = () => {
		switch (stage) {
			case TransferWizardStage.SELECT_SOURCE:
				return <SelectSourceCard />;
		}
	};

	return (
		<div className="flex flex-row gap-2 w-screen h-screen items-center justify-start p-6">
			<AnimatedCard
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="h-full flex-[1] p-2"
			>
				<CardHeader className="text-large font-medium flex flex-row gap-3 pl-4">
					<Button
						onPress={() => {
							resetSourceCardStore();
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
