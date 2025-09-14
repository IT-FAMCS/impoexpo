import { Tooltip, Code, Link, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import SettingsModal from "../modals/SettingsModal";
import { useNavigate } from "react-router";
import { Trans } from "@lingui/react/macro";

export default function SwitchesPanel(props: {
	showPrivacyPolicy?: boolean;
}) {
	const navigate = useNavigate();
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
			{(props.showPrivacyPolicy ?? false) && (
				<>
					<Icon icon="mdi:circle" width={6} />
					<Button size="sm" onPress={() => navigate("/privacy")}>
						<Trans>privacy policy</Trans>
					</Button>
				</>
			)}
		</div>
	);
}
