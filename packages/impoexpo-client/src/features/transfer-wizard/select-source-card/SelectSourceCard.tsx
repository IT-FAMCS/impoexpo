import {
	readIntegrations,
	writeIntegrations,
} from "@/integrations/integrations";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	CircularProgress,
	Divider,
	Listbox,
} from "@heroui/react";
import ActionCard from "../../../components/external/ActionCard";

import {
	SourceCardState,
	useSourceCardStore,
} from "@/features/transfer-wizard/select-source-card/store";
import {
	TransferWizardStage,
	useTransferWizardStore,
} from "@/features/transfer-wizard/store";
import { Icon } from "@iconify/react";
import { Trans, useLingui } from "@lingui/react/macro";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import AnimateChangeInSize from "../../../components/external/AnimateChangeInSize";

export default function SelectSourceCard() {
	const { state, integrationType } = useSourceCardStore();
	const { t } = useLingui();

	const title = useMemo(() => {
		if (state === SourceCardState.CHECK_ADDED_SOURCES) return t`anything else?`;
		return integrationType === "read"
			? t`what's the read source?`
			: t`what's the write source?`;
	}, [state, integrationType, t]);

	const renderer = useMemo(() => {
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
	}, [state]);

	return state === SourceCardState.DONE ? (
		<AnimatedTransitionCard />
	) : (
		<Card className="p-2 min-w-80">
			<CardHeader className="justify-center text-large">{title}</CardHeader>
			<Divider />
			<AnimateChangeInSize height>
				<CardBody>{renderer}</CardBody>
			</AnimateChangeInSize>
		</Card>
	);
}

const AnimatedCard = motion.create(Card);
function AnimatedTransitionCard() {
	const { setStage } = useTransferWizardStore();
	return (
		<AnimatedCard
			transition={{
				times: [0, 0.4, 1],
				duration: 1.5,
				ease: [0.83, 0, 0.17, 1],
			}}
			initial={{ width: "0px", height: "0px" }}
			animate={{ width: ["2rem", "100%"], height: ["2rem", "100%"] }}
			onAnimationComplete={() => setStage(TransferWizardStage.FORMAT)}
		/>
	);
}

function SourceChecker() {
	const { integrationType, setIntegrationType, setState } =
		useSourceCardStore();

	const items = (
		integrationType === "read" ? readIntegrations() : writeIntegrations()
	).flatMap((integration) => integration.selectedItemsRenderer());

	return (
		<div className="flex flex-col gap-2">
			<Listbox
				className="border-small rounded-small border-default"
				selectionMode="none"
			>
				{/*biome-ignore lint/complexity/noUselessFragments: doesn't update, no rerenders will happen*/}
				<>{items}</>
			</Listbox>
			<div className="flex flex-row items-center justify-center gap-2">
				<Button
					onPress={() => setState(SourceCardState.SELECT_SOURCE)}
					variant="light"
					color="success"
					startContent={<Icon width={18} icon="mdi:plus" />}
				>
					<Trans>add another</Trans>
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
					<Trans>next</Trans>
				</Button>
			</div>
		</div>
	);
}

function SourceSelector() {
	const { t } = useLingui();
	const { integrationType, setCurrentIntegration, setState } =
		useSourceCardStore();

	return (
		<div className="flex flex-col items-center justify-center">
			{(integrationType === "read"
				? readIntegrations()
				: writeIntegrations()
			).map((integration, idx) => {
				return (
					<ActionCard
						onPress={() => {
							setCurrentIntegration(integration);
							setState(SourceCardState.AUTHENTICATE_SOURCE);
						}}
						className="w-full p-0"
						// biome-ignore lint/suspicious/noArrayIndexKey: doesn't update, no rerenders will happen
						key={idx}
						icon={integration.icon}
						title={t(integration.title)}
					/>
				);
			})}
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
			{currentIntegration?.verifier(
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
