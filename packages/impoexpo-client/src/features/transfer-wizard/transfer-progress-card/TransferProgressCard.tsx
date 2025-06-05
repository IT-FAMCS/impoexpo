import {
	Alert,
	Card,
	Spinner,
	ScrollShadow,
	Listbox,
	ListboxItem,
	Button,
} from "@heroui/react";
import {
	TransferProgressCardState,
	useProjectStatusCardStore,
	useTransferProgressCardStore,
} from "./store";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useProjectStore } from "@/stores/project";
import {
	ProjectOutputSchema,
	type Project,
} from "@impoexpo/shared/schemas/project/ProjectSchema";
import { postForm, postWithSchemaAndResult, route } from "@/api/common";
import {
	PROJECT_TRANSFER_STATUS_ROUTE,
	CREATE_PROJECT_ROUTE,
	UPLOAD_PROJECT_FILE_ROUTE,
	RETRIEVE_PROJECT_OUTPUT_ROUTE,
} from "@impoexpo/shared/schemas/project/static";
import { Trans, useLingui } from "@lingui/react/macro";
import NetworkErrorCard from "@/components/network/NetworkErrorCard";
import { UploadProjectResponseSchema } from "@impoexpo/shared/schemas/project/UploadProjectResponseSchema";
import { t } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import {
	ProjectStatusNotificationSchema,
	type ProjectStatusNotification,
} from "@impoexpo/shared/schemas/project/ProjectStatusSchemas";
import { array, parse } from "valibot";
import { AnimatePresence, motion } from "motion/react";
import { getFile } from "@/db/files";
import Confetti from "react-confetti-boom";

export default function TransferProgressCard() {
	const { state } = useTransferProgressCardStore();

	const stateComponent = useMemo(() => {
		switch (state) {
			case TransferProgressCardState.UPLOADING_PROJECT:
				return <UploadingProjectCard />;
			case TransferProgressCardState.UPLOADING_PROJECT_FILES:
				return <UploadingProjectFilesCard />;
			case TransferProgressCardState.TRANSFERRING:
				return <ProjectStatusCard />;
			case TransferProgressCardState.DONE:
				return <ProjectOutputsCard />;
		}
	}, [state]);

	return (
		<Card className="relative flex items-center justify-center w-full h-full">
			{stateComponent}
		</Card>
	);
}

function ProjectOutputsCard() {
	const { outputs } = useTransferProgressCardStore();
	return (
		<div className="w-full h-full flex flex-col items-center justify-center relative">
			<div className="flex flex-col items-center gap-2">
				<Icon width={72} icon="mdi:check-bold" />
				<p className="text-3xl">
					<b>
						<Trans>done!</Trans>
					</b>
				</p>
				<Listbox
					className="border-small rounded-small border-default"
					disallowEmptySelection
					selectionMode="none"
					items={outputs}
				>
					{(output) => (
						<ListboxItem
							key={output.identifier}
							startContent={<Icon width={18} icon="mdi:microsoft-word" />}
							className="p-2"
							endContent={
								<Button
									color="primary"
									size="sm"
									onPress={() => {
										window.location.href = route(
											`${RETRIEVE_PROJECT_OUTPUT_ROUTE}/${output.identifier}`,
										).href;
									}}
									isIconOnly
									startContent={<Icon width={18} icon="mdi:download" />}
								/>
							}
							title={output.name}
						/>
					)}
				</Listbox>
			</div>
			<Confetti
				className="absolute w-full h-full"
				mode="boom"
				particleCount={50}
				launchSpeed={2.0}
				y={1.0}
			/>
		</div>
	);
}

function UploadingProjectFilesCard() {
	const project = useProjectStore() as Project;
	const files = Object.values(project.integrations).flatMap(
		(i) => i.files ?? [],
	);

	const { jobId, setState } = useTransferProgressCardStore();
	if (!jobId)
		throw new Error(
			"attempted to render UploadingProjectFilesCard without initializing jobId",
		);

	const queries = useQueries({
		queries: files.map((f) => {
			return {
				queryKey: ["upload-project-file", f],
				queryFn: async () => {
					const file = await getFile(f);
					if (!file)
						throw new Error(
							`no file with identifier "${f}" was found in the local database`,
						);

					const formData = new FormData();
					formData.append("file", new Blob([file.data]));
					formData.append("identifier", f);
					return postForm(`${UPLOAD_PROJECT_FILE_ROUTE}/${jobId}`, formData);
				},
			};
		}),
	});

	const completedCount = useMemo(
		() => queries.filter((q) => q.isSuccess).length,
		[...queries, queries.filter],
	);
	useEffect(() => {
		if (completedCount === files.length)
			setState(TransferProgressCardState.TRANSFERRING);
	}, [completedCount, setState, files]);

	return (
		<div className="flex flex-col items-center justify-center gap-2">
			<Trans>uploading project files</Trans>
			<Spinner />
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
				CREATE_PROJECT_ROUTE,
				project,
				UploadProjectResponseSchema,
			),
	});
	const { t } = useLingui();
	const { setJobId, setState } = useTransferProgressCardStore();

	useEffect(() => {
		if (!isSuccess) return;
		setJobId(data.job);
		setState(TransferProgressCardState.UPLOADING_PROJECT_FILES);
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
	const { setState, setOutputs } = useTransferProgressCardStore();

	const error = useMemo(
		() => !open && !reconnecting && message,
		[open, reconnecting, message],
	);

	useEffect(() => {
		setMessage(t`connecting to the server`);
	}, [setMessage]);

	useEffect(() => {
		if (result === true) setState(TransferProgressCardState.DONE);
	}, [result, setState]);

	// TODO: is this really the case?
	// biome-ignore lint/correctness/useExhaustiveDependencies: this is called once and only once per project request, so none of the outside variables matter
	useEffect(() => {
		const eventSource = new EventSource(
			route(`${PROJECT_TRANSFER_STATUS_ROUTE}/${jobId}`),
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

		eventSource.addEventListener("done", (e) => {
			try {
				const outputs = parse(array(ProjectOutputSchema), JSON.parse(e.data));
				setOutputs(outputs);
				complete();
			} catch (err) {
				console.error(`done event sent invalid payload: ${err}`);
			}
		});

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
