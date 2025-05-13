import { Alert, Card, Spinner, ScrollShadow } from "@heroui/react";
import {
	TransferProgressCardState,
	useProjectStatusCardStore,
	useTransferProgressCardStore,
} from "./store";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProjectStore } from "@/stores/project";
import type { Project } from "@impoexpo/shared/schemas/project/ProjectSchema";
import { postWithSchemaAndResult, route } from "@/api/common";
import {
	PROJECT_TRANSFER_STATUS_ENDPOINT,
	UPLOAD_PROJECT_ENDPOINT,
} from "@impoexpo/shared/schemas/project/endpoints";
import { Trans, useLingui } from "@lingui/react/macro";
import NetworkErrorCard from "@/components/network/NetworkErrorCard";
import { UploadProjectResponseSchema } from "@impoexpo/shared/schemas/project/UploadProjectResponseSchema";
import { t } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import {
	ProjectStatusNotificationSchema,
	type ProjectStatusNotification,
} from "@impoexpo/shared/schemas/project/ProjectStatusSchemas";
import { parse } from "valibot";
import { AnimatePresence, motion } from "motion/react";

export default function TransferProgressCard() {
	const { state } = useTransferProgressCardStore();

	const stateComponent = useMemo(() => {
		switch (state) {
			case TransferProgressCardState.UPLOADING_PROJECT:
				return <UploadingProjectCard />;
			case TransferProgressCardState.TRANSFERRING:
				return <ProjectStatusCard />;
		}
	}, [state]);

	return (
		<Card className="relative flex items-center justify-center w-full h-full">
			{stateComponent}
		</Card>
	);
}

const AnimatedAlert = motion.create(Alert);
function ProjectStatusCard() {
	const { jobId } = useTransferProgressCardStore();
	if (!jobId) throw new Error("invalid state in TransferringCard"); // TODO: improve these messages
	const {
		open,
		reconnecting,
		message,
		notifications,
		setMessage,
		setReconnecting,
		setOpen,
		addNotification,
		complete,
		terminate,
		result,
	} = useProjectStatusCardStore();

	const error = useMemo(
		() => !open && !reconnecting && message,
		[open, reconnecting, message],
	);

	useEffect(() => {
		setMessage(t`connecting to the server`);
	}, [setMessage]);

	// TODO: is this really the case?
	// biome-ignore lint/correctness/useExhaustiveDependencies: this is called once and only once per project request, so none of the outside variables matter
	useEffect(() => {
		const eventSource = new EventSource(
			route(`${PROJECT_TRANSFER_STATUS_ENDPOINT}/${jobId}`),
		);

		eventSource.addEventListener(
			"open",
			() => {
				setReconnecting(false);
				setOpen(true);
				setMessage(undefined);
			},
			false,
		);

		eventSource.addEventListener(
			"error",
			(e) => {
				// open shouldn't be used here because it's not specified (and shouldn't be!) in the dependency list
				if (useProjectStatusCardStore.getState().open) {
					console.warn(
						`lost connection to /project/status/${jobId}, attempting to reconnect`,
					);
					setMessage(t`reconnecting to the server`);
					setReconnecting(true);
				} else {
					console.error(
						`failed to connect to /project/status/${jobId} (SSE): ${e}`,
					);
					setMessage(t`failed to connect to the server`);
					setReconnecting(false);
					setOpen(false);
				}
			},
			false,
		);

		eventSource.addEventListener(
			"notification",
			(e) => {
				try {
					const notification = parse(
						ProjectStatusNotificationSchema,
						JSON.parse(e.data),
					);
					addNotification(e.lastEventId, notification);
					if (notification.type === "error") terminate();
				} catch (err) {
					console.error(`notification event sent invalid payload: ${err}`);
				}
			},
			false,
		);

		eventSource.addEventListener("done", complete);

		return () => eventSource.close();
	}, []);

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center gap-1">
				<Icon className="text-danger" width={48} icon="mdi:error-outline" />
				<p className="text-center">{message}</p>
			</div>
		);
	}
	if (!error && message) {
		return (
			<div className="flex flex-col items-center justify-center gap-2">
				<Spinner size="lg" />
				<p className="text-3xl">
					<b>{message}</b>
				</p>
			</div>
		);
	}

	const convertColor = (
		notificationType: ProjectStatusNotification["type"],
	) => {
		switch (notificationType) {
			case "error":
				return "danger";
			case "info":
				return "primary";
			case "warn":
				return "warning";
			case "debug":
				return "default";
		}
	};

	return (
		<div className="flex flex-col items-center justify-center gap-2">
			{result === undefined && (
				<>
					<Spinner size="lg" />
					<p className="text-3xl">
						<b>
							<Trans>we're working on your project</Trans>
						</b>
					</p>
					<p className="text-center">
						<Trans>
							this shouldn't take too long. updates will appear below:
						</Trans>
					</p>
				</>
			)}

			{result === false && (
				<>
					<Icon width={72} icon="mdi:error-outline" />
					<p className="text-3xl">
						<b>
							<Trans>we couldn't process your project</Trans>
						</b>
					</p>
					<p className="text-center">
						<Trans>
							please check the last notification to see what went wrong and try
							again.
						</Trans>
					</p>
				</>
			)}

			{result === true && (
				<>
					<Icon width={72} icon="mdi:check-bold" />
					<p className="text-3xl">
						<b>
							<Trans>done!</Trans>
						</b>
					</p>
				</>
			)}

			<ScrollShadow className="max-h-[25vh] max-w-[30vw] w-full mt-2 pb-10">
				<div className="flex flex-col h-full gap-2">
					<AnimatePresence>
						{Object.entries(notifications).map((pair) => (
							<AnimatedAlert
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5 }}
								key={pair[0]}
								color={convertColor(pair[1].type)}
							>
								{pair[1].message}
							</AnimatedAlert>
						))}
					</AnimatePresence>
				</div>
			</ScrollShadow>
		</div>
	);
}

function UploadingProjectCard() {
	const project = useProjectStore() as Project;
	const {
		isFetching,
		isError,
		isRefetchError,
		isSuccess,
		data,
		error,
		refetch,
	} = useQuery({
		queryKey: ["upload-project", project],
		queryFn: async () =>
			postWithSchemaAndResult(
				UPLOAD_PROJECT_ENDPOINT,
				project,
				UploadProjectResponseSchema,
			),
	});
	const { t } = useLingui();
	const { setJobId, setState } = useTransferProgressCardStore();

	useEffect(() => {
		if (!isSuccess) return;
		setJobId(data.job);
		setState(TransferProgressCardState.TRANSFERRING);
	}, [isSuccess, data, setJobId, setState]);

	if (isFetching) {
		return (
			<div className="flex flex-col items-center justify-center gap-2">
				<Trans>uploading your project</Trans>
				<Spinner />
			</div>
		);
	}

	if (isError || isRefetchError) {
		return (
			<NetworkErrorCard
				title={t`couldn't upload your project`}
				retry={refetch}
				error={error}
			/>
		);
	}

	return <></>;
}
