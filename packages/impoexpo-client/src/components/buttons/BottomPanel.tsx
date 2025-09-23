import { Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";

export default function BottomPanel() {
	const ctx = usePageContext();

	return (
		<Card
			as="nav"
			className="w-full h-[5.5rem] flex justify-center items-center"
			shadow="sm"
		>
			<CardBody className="flex flex-row items-center justify-between h-full px-6 overflow-hidden">
				<Button
					onPress={() => navigate("/")}
					variant="light"
					isIconOnly
					startContent={<img alt="impoexpo's logo" src="/favicon.png" />}
				/>
				<div className="flex flex-row gap-2">
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
					<Button
						variant={ctx.urlPathname === "/projects" ? "flat" : "light"}
						color={ctx.urlPathname === "/projects" ? "secondary" : "default"}
						size="sm"
						className="flex-col gap-1 py-2 text-tiny h-fit"
						onPress={() => navigate("/projects")}
						startContent={<Icon width={24} icon="mdi:calendar" />}
					>
						<Trans>projects</Trans>
					</Button>
				</div>
				<Button
					variant="light"
					color="default"
					size="sm"
					className="flex-col gap-1 py-2 text-tiny h-fit"
					startContent={<Icon width={24} icon="mdi:cog" />}
				>
					<Trans>settings</Trans>
				</Button>
			</CardBody>
		</Card>
	);
}
