import { Card, CardBody, CardHeader, CircularProgress } from "@heroui/react";
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

	const renderer = () => {
		switch (state) {
			case SourceCardState.SELECT_READ_SOURCE:
				return <SourceSelector type="read" />;
			case SourceCardState.AUTHENTICATE_READ_SOURCE:
				return <SourceAuthenticator type="read" />;
			case SourceCardState.SELECT_WRITE_SOURCE:
				return <SourceSelector type="write" />;
			case SourceCardState.AUTHENTICATE_WRITE_SOURCE:
				return <SourceAuthenticator type="write" />;
		}
	};

	return (
		<Card className="p-2">
			<CardHeader className="text-large">
				откуда будем читать данные?
			</CardHeader>
			<AnimateChangeInSize height>
				<CardBody>{renderer()}</CardBody>
			</AnimateChangeInSize>
		</Card>
	);
}

function SourceSelector(props: { type: "read" | "write" }) {
	const { setReadIntegration, setWriteIntegration } = useSourceCardStore();

	return (
		<div className="flex flex-col justify-center items-center">
			{(props.type === "read" ? readIntegrations : writeIntegrations).map(
				(integration, idx) => {
					return (
						<ActionCard
							onPress={() =>
								props.type === "read"
									? setReadIntegration(integration)
									: setWriteIntegration(integration)
							}
							className="p-0 w-full"
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

function SourceAuthenticator(props: { type: "read" | "write" }) {
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(
		undefined,
	);
	const { readIntegration } = useSourceCardStore();

	useEffect(() => {
		readIntegration
			?.checkAuthenticated()
			.then((value) => setIsAuthenticated(value));
	});
	useEffect(() => {
		if (isAuthenticated === undefined) return;
		setIsLoading(false);
	}, [isAuthenticated]);

	return (
		<div className="flex w-full justify-center items-center">
			{isLoading && <CircularProgress />}
			{!isLoading && !isAuthenticated && readIntegration?.authenticator()}
		</div>
	);
}
