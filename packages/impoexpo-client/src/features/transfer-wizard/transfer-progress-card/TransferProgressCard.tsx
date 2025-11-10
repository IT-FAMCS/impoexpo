import { route } from "@/api/common";
import {
	type FileUploadStatusChange,
	TransferHandler,
	TransferHandlerState,
} from "@/api/TransferHandler";
import { clearStatesFromDatabase } from "@/db/persisted";
import { localizableString } from "@/features/format-editor/nodes/renderable-node-types";
import { useProjectStore } from "@/stores/project";
import { resetStores, WIZARD_STORE_CATEGORY } from "@/stores/resettable";
import { AnimatedAlert, AnimatedCard } from "@/styles/motion";
import { Button, Card, Code, ScrollShadow } from "@heroui/react";
import { Icon } from "@iconify/react";
import type {
	Project,
	ProjectOutput,
} from "@impoexpo/shared/schemas/project/ProjectSchema";
import type { ProjectStatusNotification } from "@impoexpo/shared/schemas/project/ProjectStatusSchemas";
import { RETRIEVE_PROJECT_OUTPUT_ROUTE } from "@impoexpo/shared/schemas/project/static";
import { Trans, useLingui } from "@lingui/react/macro";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import prettyBytes from "pretty-bytes";
import { type PropsWithChildren, useEffect, useState } from "react";
import Confetti from "react-confetti-boom";
import useSound from "use-sound";
import { navigate } from "vike/client/router";
import "./style.css";
import meowSfx from "/sounds/meow.mp3?url";

function AnimatedGridCell(
	props: PropsWithChildren<{
		corner: "bottom-left" | "bottom-right" | "top-left" | "top-right";
		show: boolean;
		classNames: {
			base?: string;
			card?: string;
			div?: string;
		};
	}>,
) {
	const alignment = () => {
		switch (props.corner) {
			case "bottom-left":
				return "justify-start items-end";
			case "bottom-right":
				return "justify-end items-end";
			case "top-left":
				return "justify-start items-start";
			case "top-right":
				return "justify-end items-start";
		}
	};

	return (
		<div
			className={clsx(props.classNames.base, alignment(), "flex w-full h-full")}
		>
			<AnimatePresence>
				{props.show && (
					<AnimatedCard
						className={props.classNames.card}
						initial={{ width: "0", height: "0" }}
						animate={{
							width: "100%",
							height: "100%",
						}}
						transition={{
							times: [0, 0.4, 1],
							duration: 1,
							ease: [0.83, 0, 0.17, 1],
						}}
					>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 1, duration: 0.5 }}
							className={clsx(props.classNames.div, "h-full")}
						>
							{props.children}
						</motion.div>
					</AnimatedCard>
				)}
			</AnimatePresence>
		</div>
	);
}

function TransferOutputCard(props: {
	className?: string;
	outputs: ProjectOutput[];
	index: number;
}) {
	return (
		<AnimatedGridCell
			classNames={{
				base: props.className,
				div: "p-4 flex flex-col justify-between",
			}}
			show={props.outputs.length > props.index}
			corner="top-left"
		>
			<div className="flex flex-col gap-2">
				<Icon width={72} icon="mdi:file-document" className="-mb-2 -ml-2" />
				<p className="text-4xl overflow-ellipsis line-clamp-2">
					{props.outputs.at(props.index)?.name ?? ""}
				</p>
				<p className="text-xl text-foreground-500">
					{prettyBytes(props.outputs.at(props.index)?.size ?? 0)}
				</p>
			</div>
			<div className="flex flex-row gap-2 h-max">
				<Button
					onPress={() => {
						const output = props.outputs.at(props.index);
						if (!output) return;
						window.location.href = route(
							`${RETRIEVE_PROJECT_OUTPUT_ROUTE}/${output.identifier}`,
						).href;
					}}
					className="flex flex-col flex-grow h-full gap-0 py-2"
				>
					<Icon className="min-w-12" width={48} icon="mdi:download" />
					<Trans>download</Trans>
				</Button>
			</div>
		</AnimatedGridCell>
	);
}

export default function TransferProgressCard() {
	const { t, i18n } = useLingui();
	const [handlerState, setHandlerState] = useState<TransferHandlerState>(
		TransferHandlerState.IDLE,
	);
	const [outputs, setOutputs] = useState<ProjectOutput[]>([]);
	const [notifications, setNotifications] = useState<
		ProjectStatusNotification[]
	>([]);
	const [transferringStarted, setTransferringStarted] = useState(false);
	const [fileUploadInformation, setFileUploadInformation] =
		useState<FileUploadStatusChange>();
	// biome-ignore lint/style/noNonNullAssertion: initialized asap
	const [handler, setHandler] = useState<TransferHandler>(null!);
	const [playMeow] = useSound(meowSfx);

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

	const run = () => {
		setHandlerState(TransferHandlerState.IDLE);
		setFileUploadInformation(undefined);
		setTransferringStarted(false);
		setNotifications([]);

		const newHandler = new TransferHandler(
			useProjectStore.getState() as Project,
		);
		newHandler.addEventListener("state-changed", (state) => {
			setHandlerState(state);
			if (state === TransferHandlerState.DONE) setOutputs(newHandler.outputs);
		});
		newHandler.addEventListener("file-uploaded", setFileUploadInformation);
		newHandler.addEventListener("notification", () =>
			setNotifications(newHandler.notifications),
		);
		newHandler.start();

		setHandler(newHandler);
	};

	useEffect(() => {
		if (!handler) setTimeout(run, 1000);
	}, [handler, run]);

	useEffect(() => {
		if (transferringStarted) return;
		if (handlerState === TransferHandlerState.CONNECTING)
			setTransferringStarted(true);
	}, [transferringStarted, handlerState]);

	const stringifyState = () => {
		switch (handlerState) {
			case TransferHandlerState.UPLOADING_PROJECT:
				return t`uploading the project`;
			case TransferHandlerState.UPLOADING_PROJECT_FILES:
				return t`uploading project files`;
			case TransferHandlerState.CONNECTING:
				return t`connecting to the server`;
			case TransferHandlerState.CONNECTED:
				return t`transferring`;
			case TransferHandlerState.RECONNECTING:
				return t`reconnecting to the server`;
			case TransferHandlerState.DONE:
				return t`done!`;
			case TransferHandlerState.IDLE:
				return t`preparing`;
			case TransferHandlerState.TERMINATED:
				return t`you were not supposed to see this.`;
		}
	};

	return (
		<Card className="relative grid w-full h-full grid-cols-6 grid-rows-5 gap-4 p-4">
			<AnimatedGridCell
				classNames={{
					base: "col-span-2 col-start-3 row-start-5",
					card:
						handlerState === TransferHandlerState.DONE
							? handler.outputs.length > 4
								? "bg-success"
								: "bg-secondary"
							: "bg-warning",
				}}
				corner="bottom-right"
				show={
					handlerState === TransferHandlerState.DONE ||
					handlerState === TransferHandlerState.TERMINATED
				}
			>
				{handlerState === TransferHandlerState.DONE ? (
					handler.outputs.length > 4 ? (
						<Button
							color="success"
							className="flex flex-col w-full h-full gap-0 text-3xl"
						>
							<Icon
								className="min-w-16"
								width={64}
								icon="mdi:folder-multiple"
							/>
							<Trans>view all files</Trans>
						</Button>
					) : (
						<Button
							color="secondary"
							className="flex flex-col w-full h-full gap-0 text-3xl"
							isIconOnly
							onPress={() => playMeow()}
						>
							<Icon className="min-w-24" width={96} icon="mdi:cat" />
						</Button>
					)
				) : (
					<Button
						color="warning"
						className="flex flex-col w-full h-full gap-0 text-3xl"
						onPress={run}
					>
						<Icon className="min-w-16" width={64} icon="mdi:refresh" />
						<Trans>try again</Trans>
					</Button>
				)}
			</AnimatedGridCell>

			<AnimatedGridCell
				classNames={{
					base: "col-span-2 col-start-5 row-start-5",
					card: "bg-primary",
				}}
				corner="bottom-right"
				show={
					handlerState === TransferHandlerState.DONE ||
					handlerState === TransferHandlerState.TERMINATED
				}
			>
				<Button
					color="primary"
					className="flex flex-col w-full h-full gap-0 text-3xl whitespace-pre-wrap"
					onPress={async () => {
						await clearStatesFromDatabase();
						resetStores(WIZARD_STORE_CATEGORY);
						navigate("/");
					}}
				>
					<Icon className="min-w-16" width={64} icon="mdi:home" />
					<Trans>return to the homepage</Trans>
				</Button>
			</AnimatedGridCell>

			<AnimatedGridCell
				classNames={{
					base: "col-span-2 row-span-3",
					card: "flex flex-col justify-end items-start",
					div: "flex flex-col p-4 h-full w-full",
				}}
				show={transferringStarted}
				corner="bottom-left"
			>
				{notifications.length === 0 ? (
					<div className="flex items-end justify-start w-full h-full">
						<p className="text-2xl text-foreground-400">
							<i>
								<Trans>
									notifications will appear here
									<br />
									(if there are any)
								</Trans>
							</i>
						</p>
					</div>
				) : (
					<ScrollShadow className="flex flex-col gap-2">
						<AnimatePresence>
							{Object.entries(notifications).map((p) => (
								<AnimatedAlert
									initial={{ opacity: 0, y: 5 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5 }}
									key={p[0]}
									color={convertColor(p[1].type)}
									className="h=min"
								>
									{p[1].message}
								</AnimatedAlert>
							))}
						</AnimatePresence>
					</ScrollShadow>
				)}
			</AnimatedGridCell>

			<AnimatedGridCell
				classNames={{
					base: "col-span-2 row-span-2 row-start-4",
					div: "flex flex-col items-start justify-end gap-2 m-4",
				}}
				show={true}
				corner="bottom-left"
			>
				{handlerState === TransferHandlerState.TERMINATED &&
				handler.terminationReason ? (
					<>
						<Icon width={96} className="-mb-2 -ml-2" icon="mdi:error-outline" />
						<p className="text-5xl">
							{localizableString(handler.terminationReason.short, t)}
						</p>
						<Code color="danger" className="whitespace-normal">
							{handler.terminationReason.technical}
						</Code>
					</>
				) : (
					<>
						<AnimatePresence>
							{handlerState !== TransferHandlerState.DONE && (
								<motion.div
									key="loading-icon"
									initial={{ opacity: 1 }}
									exit={{ opacity: 0, display: "none" }}
									transition={{ ease: [0.83, 0, 0.17, 1], duration: 0.5 }}
									className="la-ball-grid-pulse la-3x"
								>
									<div /> <div /> <div /> <div /> <div /> <div /> <div />{" "}
									<div /> <div />
								</motion.div>
							)}
							{handlerState === TransferHandlerState.DONE && (
								<motion.div
									initial={{ opacity: 0, display: "none" }}
									animate={{ opacity: 1, display: "block" }}
									transition={{
										ease: [0.83, 0, 0.17, 1],
										delay: 0.5,
										duration: 0.5,
									}}
									className="-mb-2 -ml-2 size-24"
								>
									<Icon icon="mdi:check" width={96} />
								</motion.div>
							)}
						</AnimatePresence>
						<p
							className={clsx(
								handler.stopTime !== 0 ? "leading-0" : "",
								"text-5xl",
							)}
						>
							{stringifyState()}
							{handlerState === TransferHandlerState.UPLOADING_PROJECT_FILES &&
								fileUploadInformation && (
									<span className="text-foreground-500">
										{" "}
										({fileUploadInformation.uploaded}/
										{fileUploadInformation.total})
									</span>
								)}
							{handler.stopTime !== 0 && (
								<span className="text-xl text-foreground-500">
									<br />
									<Trans>took {handler.timeTaken(i18n.locale)}</Trans>
								</span>
							)}
						</p>
					</>
				)}
			</AnimatedGridCell>

			{handlerState === TransferHandlerState.DONE && (
				<>
					<TransferOutputCard
						className="col-span-2 col-start-3 row-span-2 row-start-1"
						outputs={outputs}
						index={0}
					/>
					<TransferOutputCard
						className="col-span-2 col-start-5 row-span-2 row-start-1"
						outputs={outputs}
						index={1}
					/>
					<TransferOutputCard
						className="col-span-2 col-start-3 row-span-2 row-start-3"
						outputs={outputs}
						index={2}
					/>
					<TransferOutputCard
						className="col-span-2 col-start-5 row-span-2 row-start-3"
						outputs={outputs}
						index={3}
					/>
				</>
			)}

			{handlerState === TransferHandlerState.DONE && (
				<Confetti
					className="absolute w-full h-full pointer-events-none"
					mode="boom"
					particleCount={50}
					launchSpeed={2.5}
					y={1.0}
					x={0}
					deg={300}
					effectCount={1}
				/>
			)}
		</Card>
	);
}
