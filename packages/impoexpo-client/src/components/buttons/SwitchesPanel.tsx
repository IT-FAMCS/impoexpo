import { Tooltip, Code, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";

export default function SwitchesPanel() {
	return (
		<div className="flex flex-row items-center justify-center gap-2">
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
				<Code className="flex flex-row items-center justify-center gap-2">
					v{import.meta.env.VITE_APP_VERSION}{" "}
					<Icon icon="mdi:circle" width={4} />
					{import.meta.env.VITE_APP_HASH}
				</Code>
			</Tooltip>
			<Icon icon="mdi:circle" width={6} />
			<ThemeSwitcher />
			<Icon icon="mdi:circle" width={6} />
			<LanguageSwitcher />
		</div>
	);
}
