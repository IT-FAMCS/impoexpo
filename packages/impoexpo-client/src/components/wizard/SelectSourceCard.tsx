import {
	Button,
	Card,
	CardBody,
	CardHeader,
	CircularProgress,
	Divider,
	Listbox,
} from "@heroui/react";
import ActionCard from "../external/ActionCard";
import {
	readIntegrations,
	writeIntegrations,
} from "@/integrations/integrations";
import { useEffect, useMemo, useState } from "react";
import AnimateChangeInSize from "../external/AnimateChangeInSize";
import {
	SourceCardState,
	useSourceCardStore,
} from "@/stores/select-source-card";
import { Icon } from "@iconify/react";
import { TransferWizardStage, useTransferWizardStore } from "@/stores/wizard";
import { motion } from "framer-motion";

export default function SelectSourceCard() {
	const { state, integrationType } = useSourceCardStore();

	const title = useMemo(() => {
		if (state === SourceCardState.CHECK_ADDED_SOURCES) return "что-нибудь ещё?";
		return integrationType === "read"
			? "откуда будем читать данные?"
			: "куда будем записывать данные?";
	}, [state, integrationType]);

	const renderer = () => {
		switch (state) {
			case SourceCardState.SELECT_SOURCE:
				return <SourceSelector />;
			case SourceCardState.AUTHENTICATE_SOURCE:
				return <SourceAuthenticator />;
			case SourceCardState.VERIFY_SOURCE:
				return <SourceVerificator />;
			case SourceCardState.HYDRATE_SOURCE:
				return <SourceHydrator />;
			case SourceCardState.CHECK_ADDED_SOURCES:
				return <SourceChecker />;
		}
	};

	return state === SourceCardState.DONE ? (
		<AnimatedTransitionCard />
	) : (
		<Card className="p-2">
			<CardHeader className="justify-center text-large">{title}</CardHeader>
			<Divider />
			<AnimateChangeInSize height>
				<CardBody>{renderer()}</CardBody>
			</AnimateChangeInSize>
		</Card>
	);
}

const AnimatedCard = motion.create(Card);
function AnimatedTransitionCard() {
	const { setStage } = useTransferWizardStore();
	return (
		<AnimatedCard
			transition={{ delay: 0.5, duration: 1.0, ease: "easeInOut" }}
			initial={{ width: "2rem", height: "2rem" }}
			animate={{
				width: "100%",
				height: "100%",
			}}
			onAnimationComplete={() => setStage(TransferWizardStage.FORMAT)}
		/>
	);
}

function SourceChecker() {
	const { integrationType, setIntegrationType, setState } =
		useSourceCardStore();

	const items = (
		integrationType === "read" ? readIntegrations : writeIntegrations
	).flatMap((integration) => integration.selectedItemsRenderer());

	return (
		<div className="flex flex-col gap-2">
			<Listbox
				className="border-small rounded-small border-default"
				selectionMode="none"
			>
				{/* biome-ignore lint/complexity/noUselessFragments: <explanation> */}
				<>{...items}</>
			</Listbox>
			<div className="flex flex-row gap-2 justify-center items-center">
				<Button
					onPress={() => setState(SourceCardState.SELECT_SOURCE)}
					variant="light"
					color="success"
					startContent={<Icon width={18} icon="mdi:plus" />}
				>
					добавить ещё
				</Button>
				<Button
					onPress={() => {
						setState(
							integrationType === "read"
								? SourceCardState.SELECT_SOURCE
								: SourceCardState.DONE,
						);
						if (integrationType === "read") setIntegrationType("write");
					}}
					color="primary"
					endContent={<Icon width={18} icon="mdi:arrow-right" />}
				>
					далее
				</Button>
			</div>
		</div>
	);
}

function SourceSelector() {
	const { integrationType, setCurrentIntegration, setState } =
		useSourceCardStore();

	return (
		<div className="flex flex-col items-center justify-center">
			{(integrationType === "read" ? readIntegrations : writeIntegrations).map(
				(integration, idx) => {
					return (
						<ActionCard
							onPress={() => {
								/*
								integration === "read"
									? setReadIntegration(integration)
									: setWriteIntegration(integration)
								*/
								// TODO: hydrate project state when it's implemented
								setCurrentIntegration(integration);
								setState(SourceCardState.AUTHENTICATE_SOURCE);
							}}
							className="w-full p-0"
							// biome-ignore lint/suspicious/noArrayIndexKey: doesn't update, no rerenders will happen
							key={idx}
							icon={integration.icon}
							title={integration.title}
						/>
					);
				},
			)}
		</div>
	);
}

function SourceHydrator() {
	const { currentIntegration, setState } = useSourceCardStore();

	return (
		<div className="flex items-center justify-center w-full">
			{currentIntegration?.hydrator(() =>
				setState(SourceCardState.CHECK_ADDED_SOURCES),
			)}
		</div>
	);
}

function SourceVerificator() {
	const { currentIntegration, setState } = useSourceCardStore();

	return (
		<div className="flex items-center justify-center w-full">
			{currentIntegration?.verificator(
				() => {
					setState(SourceCardState.HYDRATE_SOURCE);
				},
				() => {
					setState(SourceCardState.AUTHENTICATE_SOURCE);
				},
			)}
		</div>
	);
}

function SourceAuthenticator() {
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(
		undefined,
	);
	const { currentIntegration, setState } = useSourceCardStore();

	useEffect(() => {
		currentIntegration
			?.checkAuthenticated()
			.then((value) => setIsAuthenticated(value));
	});
	useEffect(() => {
		if (isAuthenticated === undefined) return;
		if (isAuthenticated) {
			continueFlow();
			return;
		}
		setIsLoading(false);
	}, [isAuthenticated]);

	const continueFlow = () => setState(SourceCardState.VERIFY_SOURCE);

	return (
		<div className="flex items-center justify-center w-full">
			{isLoading && <CircularProgress />}
			{!isLoading &&
				!isAuthenticated &&
				currentIntegration?.authenticator(continueFlow)}
		</div>
	);
}
