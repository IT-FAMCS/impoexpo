import { Button, Card, CardBody, Code, Link, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";
import LocalProjectsManagerModal from "../modals/LocalProjectsManagerModal";
import SettingsModal from "../modals/SettingsModal";

export default function BottomPanel() {
	const ctx = usePageContext();

	return (
		<Card
			as="nav"
			className="flex items-center justify-center w-full h-20 shrink-0"
			shadow="sm"
		>
			<CardBody className="flex flex-row items-center justify-between h-full px-6 overflow-hidden">
				<div className="flex flex-row items-center gap-4">
					<Button
						onPress={() => navigate("/")}
						variant="light"
						isIconOnly
						startContent={<img alt="impoexpo's logo" src="/favicon.png" />}
					/>
					<Tooltip
						content={
							<Link
								isExternal
								showAnchorIcon
								href={import.meta.env.VITE_APP_LAST_COMMIT_LINK}
							>
								{import.meta.env.VITE_APP_LAST_COMMIT_MESSAGE}
							</Link>
						}
					>
						<Code className="flex-row items-center justify-center hidden gap-2 xl:flex">
							v{import.meta.env.VITE_APP_VERSION}{" "}
							<Icon icon="mdi:circle" width={4} />
							{import.meta.env.VITE_APP_HASH}
						</Code>
					</Tooltip>
				</div>
				<div className="flex-row items-center hidden gap-4 xl:flex">
					<Button
						variant={ctx.urlPathname === "/wizard" ? "flat" : "light"}
						color={ctx.urlPathname === "/wizard" ? "primary" : "default"}
						size="sm"
						className="flex-col gap-1 py-2 text-tiny h-fit"
						onPress={() => navigate("/wizard")}
						startContent={
							<Icon width={24} icon="material-symbols:compare-arrows-rounded" />
						}
					>
						<Trans>transfer</Trans>
					</Button>
					<LocalProjectsManagerModal />
				</div>
				<div className="flex-row items-center hidden gap-4 xl:flex">
					<SettingsModal />
					<Button
						variant="light"
						color="default"
						size="sm"
						className="flex-col gap-1 py-2 text-tiny h-fit"
						startContent={<Icon width={24} icon="mdi:book-open-variant" />}
						as={Link}
						href={import.meta.env.VITE_DOCS_URL}
						isExternal
					>
						<Trans>documentation</Trans>
					</Button>
					<Button
						variant={ctx.urlPathname === "/privacy" ? "flat" : "light"}
						color={ctx.urlPathname === "/privacy" ? "secondary" : "default"}
						size="sm"
						className="flex-col gap-1 py-2 text-tiny h-fit"
						onPress={() => navigate("/privacy")}
						startContent={<Icon width={24} icon="mdi:shield-lock" />}
					>
						<Trans>legal</Trans>
					</Button>
				</div>
			</CardBody>
		</Card>
	);
}
