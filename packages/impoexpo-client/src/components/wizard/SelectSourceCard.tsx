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
			case SourceCardState.SELECT_READ_SOURCE:
				return <SourceSelector type="read" />;
			case SourceCardState.AUTHENTICATE_READ_SOURCE:
				return <SourceAuthenticator type="read" />;
			case SourceCardState.VERIFY_READ_SOURCE:
				return <SourceVerificator type="read" />;
			case SourceCardState.HYDRATE_READ_SOURCE:
				return <SourceHydrator type="read" />;
			case SourceCardState.SELECT_WRITE_SOURCE:
				return <SourceSelector type="write" />;
			case SourceCardState.AUTHENTICATE_WRITE_SOURCE:
				return <SourceAuthenticator type="write" />;
			case SourceCardState.VERIFY_WRITE_SOURCE:
				return <SourceVerificator type="write" />;
			case SourceCardState.HYDRATE_WRITE_SOURCE:
				return <SourceHydrator type="write" />;
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

function SourceSelector(props: { type: "read" | "write" }) {
	const { setReadIntegration, setWriteIntegration } = useSourceCardStore();

	return (
		<div className="flex flex-col items-center justify-center">
			{(props.type === "read" ? readIntegrations : writeIntegrations).map(
				(integration, idx) => {
					return (
						<ActionCard
							onPress={() =>
								props.type === "read"
									? setReadIntegration(integration)
									: setWriteIntegration(integration)
							}
							className="w-full p-0"
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

function SourceHydrator(props: { type: "read" | "write" }) {
	const { readIntegration, writeIntegration, setState } = useSourceCardStore();

	return (
		<div className="flex items-center justify-center w-full">
			{(props.type === "read" ? readIntegration : writeIntegration)?.hydrator(
				() => {
					setState(
						props.type === "read"
							? SourceCardState.SELECT_WRITE_SOURCE
							: SourceCardState.DONE,
					);
				},
			)}
		</div>
	);
}

function SourceVerificator(props: { type: "read" | "write" }) {
	const { readIntegration, writeIntegration, setState } = useSourceCardStore();

	return (
		<div className="flex items-center justify-center w-full">
			{(props.type === "read"
				? readIntegration
				: writeIntegration
			)?.verificator(
				() => {
					setState(
						props.type === "read"
							? SourceCardState.HYDRATE_READ_SOURCE
							: SourceCardState.HYDRATE_WRITE_SOURCE,
					);
				},
				() => {
					setState(
						props.type === "read"
							? SourceCardState.AUTHENTICATE_READ_SOURCE
							: SourceCardState.AUTHENTICATE_WRITE_SOURCE,
					);
				},
			)}
		</div>
	);
}

function SourceAuthenticator(props: { type: "read" | "write" }) {
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(
		undefined,
	);
	const { readIntegration, writeIntegration, setState } = useSourceCardStore();

	useEffect(() => {
		(props.type === "read" ? readIntegration : writeIntegration)
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

	const continueFlow = () =>
		setState(
			props.type === "read"
				? SourceCardState.VERIFY_READ_SOURCE
				: SourceCardState.VERIFY_WRITE_SOURCE,
		);

	return (
		<div className="flex items-center justify-center w-full">
			{isLoading && <CircularProgress />}
			{!isLoading &&
				!isAuthenticated &&
				(props.type === "read"
					? readIntegration
					: writeIntegration
				)?.authenticator(continueFlow)}
		</div>
	);
}
