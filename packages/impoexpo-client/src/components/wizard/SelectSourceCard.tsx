import {
	Card,
	CardBody,
	CardHeader,
	CircularProgress,
	Divider,
} from "@heroui/react";
import ActionCard from "../external/ActionCard";
import {
	readIntegrations,
	writeIntegrations,
} from "@/integrations/integrations";
import { useEffect, useState } from "react";
import AnimateChangeInSize from "../external/AnimateChangeInSize";
import {
	SourceCardState,
	useSourceCardStore,
} from "@/stores/select-source-card";

export default function SelectSourceCard() {
	const { state } = useSourceCardStore();

	console.log(SourceCardState[state]);

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
		}
	};

	return (
		<Card className="p-2">
			<CardHeader className="justify-center text-large">
				откуда будем читать данные?
			</CardHeader>
			<Divider />
			<AnimateChangeInSize height>
				<CardBody>{renderer()}</CardBody>
			</AnimateChangeInSize>
		</Card>
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
	const { currentIntegration, integrationType, setIntegrationType, setState } =
		useSourceCardStore();

	return (
		<div className="flex items-center justify-center w-full">
			{currentIntegration?.hydrator(() => {
				if (integrationType === "read") setIntegrationType("write");
				setState(
					integrationType === "read"
						? SourceCardState.SELECT_SOURCE
						: SourceCardState.DONE,
				);
			})}
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
