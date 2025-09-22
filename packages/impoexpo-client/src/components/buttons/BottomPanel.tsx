import {
	Button,
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";

export default function BottomPanel() {
	const ctx = usePageContext();
	console.log(ctx.urlPathname);
	return (
		<Navbar
			position="static"
			className="bottom-12 h-[5.5rem] border-t border-divider"
		>
			<NavbarBrand className="h-full">
				<Button
					onPress={() => navigate("/")}
					variant="light"
					isIconOnly
					startContent={<img alt="impoexpo's logo" src="/favicon.png" />}
				/>
			</NavbarBrand>
			<NavbarContent justify="center">
				<NavbarItem className="">
					<Button
						variant={ctx.urlPathname === "/wizard" ? "flat" : "light"}
						color={ctx.urlPathname === "/wizard" ? "primary" : "default"}
						size="sm"
						className="text-tiny flex-col gap-1 py-2 h-fit"
						onPress={() => navigate("/wizard")}
						startContent={
							<Icon width={24} icon="material-symbols:compare-arrows-rounded" />
						}
					>
						<Trans>transfer</Trans>
					</Button>
				</NavbarItem>
				<NavbarItem className="">
					<Button
						variant={ctx.urlPathname === "/projects" ? "flat" : "light"}
						color={ctx.urlPathname === "/projects" ? "secondary" : "default"}
						size="sm"
						className="text-tiny flex-col gap-1 py-2 h-fit"
						onPress={() => navigate("/projects")}
						startContent={<Icon width={24} icon="mdi:calendar" />}
					>
						<Trans>projects</Trans>
					</Button>
				</NavbarItem>
			</NavbarContent>
			<NavbarContent justify="end">
				<NavbarItem className="">
					<Button
						variant="light"
						color="default"
						size="sm"
						className="text-tiny flex-col gap-1 py-2 h-fit"
						startContent={<Icon width={24} icon="mdi:cog" />}
					>
						<Trans>settings</Trans>
					</Button>
				</NavbarItem>
			</NavbarContent>
		</Navbar>
	);
}
