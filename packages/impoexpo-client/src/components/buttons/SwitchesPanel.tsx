import { Tooltip, Code, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import SettingsModal from "../modals/SettingsModal";

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
			<SettingsModal />
		</div>
	);
}
