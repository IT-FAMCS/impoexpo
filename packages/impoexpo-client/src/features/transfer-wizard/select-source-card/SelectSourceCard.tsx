import {
	readIntegrations,
	writeIntegrations,
} from "@/integrations/integrations";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Spinner,
	Divider,
	Listbox,
	ListboxItem,
	addToast,
} from "@heroui/react";
import ActionCard from "../../../components/external/ActionCard";

import {
	SourceCardState,
	useSourceCardStore,
} from "@/features/transfer-wizard/select-source-card/store";
import {
	FormatEditorWrapperState,
	TransferWizardStage,
	useFormatEditorWrapperStore,
	useTransferWizardStore,
} from "@/features/transfer-wizard/store";
import { Icon } from "@iconify/react";
import { Trans, useLingui } from "@lingui/react/macro";
import { useEffect, useMemo, useState } from "react";
import AnimateChangeInSize from "../../../components/external/AnimateChangeInSize";
import { useQuery } from "@tanstack/react-query";
import NetworkErrorCard from "@/components/network/NetworkErrorCard";
import {
	DefaultIntegrationAuthenticator,
	DefaultIntegrationHydrator,
	DefaultIntegrationVerifier,
} from "@/integrations/common";
import FileDropzone from "@/components/modals/FileDropzone";
import { parse } from "valibot";
import { applyProjectSnapshot, ProjectSnapshotSchema } from "@/db/snapshot";

export default function SelectSourceCard() {
	const { state, integrationType } = useSourceCardStore();

	const { setStage } = useTransferWizardStore();
	const { setState: setTransitionCardState } = useFormatEditorWrapperStore();

	const { t } = useLingui();

	const title = useMemo(() => {
		switch (state) {
			case SourceCardState.MAYBE_IMPORT_PROJECT_TEMPLATE:
				return t`where shall we start?`;
			case SourceCardState.CHECK_ADDED_SOURCES:
				return t`anything else?`;
			default:
				return integrationType === "read"
					? t`what's the read source?`
					: t`what's the write source?`;
		}
	}, [state, integrationType, t]);

	const renderer = useMemo(() => {
		switch (state) {
			case SourceCardState.MAYBE_IMPORT_PROJECT_TEMPLATE:
				return <ProjectTemplateSelector />;
			case SourceCardState.SELECT_SOURCE:
				return <SourceSelector />;
			case SourceCardState.AUTHENTICATE_SOURCE:
				return <SourceAuthenticator />;
			case SourceCardState.VERIFY_SOURCE:
				return <SourceVerifier />;
			case SourceCardState.HYDRATE_SOURCE:
				return <SourceHydrator />;
			case SourceCardState.CHECK_ADDED_SOURCES:
				return <SourceChecker />;
			case SourceCardState.DONE:
				setStage(TransferWizardStage.FORMAT);
				setTransitionCardState(FormatEditorWrapperState.IN);
				return <></>;
		}
	}, [state, setStage, setTransitionCardState]);

	return (
		<Card className="max-w-[40vw] p-2 min-w-[15vw]">
			<CardHeader className="justify-center text-large">{title}</CardHeader>
			<Divider />
			<AnimateChangeInSize height>
				<CardBody>{renderer}</CardBody>
			</AnimateChangeInSize>
		</Card>
	);
}

function ProjectTemplateSelector() {
	const { setState } = useSourceCardStore();
	const [importing, setImporting] = useState(false);

	return importing ? (
		<div className="flex flex-col gap-2">
			<FileDropzone
				options={{
					accept: { "application/json": [".json"] },
					async onDropAccepted(files) {
						// TODO: be more informative here
						try {
							const raw = JSON.parse(await files[0].text());
							const snapshot = parse(ProjectSnapshotSchema, raw);
							await applyProjectSnapshot(snapshot);
							setState(SourceCardState.SELECT_SOURCE);
						} catch (err) {
							addToast({
								color: "danger",
								title: <Trans>failed to import the project template</Trans>,
								description: <p className="font-mono">{`${err}`}</p>,
							});
						}
					},
				}}
			/>
			<Button
				onPress={() => setImporting(false)}
				startContent={<Icon icon="mdi:chevron-left" />}
			>
				<Trans>go back</Trans>
			</Button>
		</div>
	) : (
		<div className="flex flex-col gap-2">
			<Button
				color="primary"
				onPress={() => setState(SourceCardState.SELECT_SOURCE)}
			>
				<Trans>create an empty project</Trans>
			</Button>
			<div className="flex flex-row justify-center items-center gap-2">
				<Divider className="w-20" />
				<Trans>or</Trans>
				<Divider className="w-20" />
			</div>
			<Button onPress={() => setImporting(true)}>
				<Trans>import an existing project</Trans>
			</Button>
		</div>
	);
}

function SourceChecker() {
	const { integrationType, setIntegrationType, setState } =
		useSourceCardStore();

	const items = (
		integrationType === "read" ? readIntegrations() : writeIntegrations()
	)
		.filter((i) => i.selectedItemsRenderer)
		// biome-ignore lint/style/noNonNullAssertion: filtered out
		.flatMap((i) => i.selectedItemsRenderer!());

	return (
		<div className="flex flex-col gap-2">
			<Listbox
				className="border-small rounded-small border-default"
				selectionMode="none"
				items={items}
			>
				{(props) => <ListboxItem {...props} key={props.key} />}
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
		<div className="flex flex-col items-center justify-center gap-2">
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
			{currentIntegration?.hydrator ? (
				currentIntegration?.hydrator(() =>
					setState(SourceCardState.CHECK_ADDED_SOURCES),
				)
			) : (
				<DefaultIntegrationHydrator
					callback={() => setState(SourceCardState.CHECK_ADDED_SOURCES)}
				/>
			)}
		</div>
	);
}

function SourceVerifier() {
	const { currentIntegration, setState } = useSourceCardStore();

	return (
		<div className="flex items-center justify-center w-full">
			{currentIntegration?.verifier ? (
				currentIntegration?.verifier(
					() => {
						setState(SourceCardState.HYDRATE_SOURCE);
					},
					() => {
						setState(SourceCardState.AUTHENTICATE_SOURCE);
					},
				)
			) : (
				<DefaultIntegrationVerifier
					successCallback={() => {
						setState(SourceCardState.HYDRATE_SOURCE);
					}}
					resetCallback={() => {
						setState(SourceCardState.AUTHENTICATE_SOURCE);
					}}
				/>
			)}
		</div>
	);
}

function SourceAuthenticator() {
	const { t } = useLingui();
	const { currentIntegration, setState } = useSourceCardStore();
	if (!currentIntegration)
		throw new Error(
			"attempted to render SourceAuthenticator without currentIntegration set",
		);

	const { isFetching, isError, error, data, refetch } = useQuery({
		queryKey: [`check-authenticated-${currentIntegration}`],
		queryFn:
			currentIntegration.checkAuthenticated ?? (() => Promise.resolve(true)),
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (data === true) setState(SourceCardState.VERIFY_SOURCE);
	}, [data, setState]);

	return (
		<div className="flex items-center justify-center w-full">
			{isFetching && <Spinner />}
			{isError && (
				<NetworkErrorCard
					error={error}
					retry={refetch}
					title={t`failed to check integration authentication status`}
				/>
			)}
			{data === false &&
				(currentIntegration?.authenticator ? (
					currentIntegration?.authenticator(() =>
						setState(SourceCardState.VERIFY_SOURCE),
					)
				) : (
					<DefaultIntegrationAuthenticator
						callback={() => setState(SourceCardState.VERIFY_SOURCE)}
					/>
				))}
		</div>
	);
}
