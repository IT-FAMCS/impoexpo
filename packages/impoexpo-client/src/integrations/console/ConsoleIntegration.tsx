import type { Integration } from "@/types/Integration";
import { Icon } from "@iconify/react";
import { ListboxItem } from "@heroui/react";
import { useConsoleIntegrationStore } from "./store";
import { useEffect } from "react";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";

export const ConsoleIntegration: Integration = {
	id: "console",
	title: msg`Console`,
	icon: <Icon icon="mdi:console" />,
	read: false,
	write: true,
	checkAuthenticated: () => Promise.resolve(true),

	authenticator: (callback) => {
		useEffect(callback, []);
		return <></>;
	},
	verificator: (callback) => {
		useEffect(callback, []);
		return <></>;
	},
	hydrator: (callback) => {
		useConsoleIntegrationStore.setState({ enabled: true });
		useEffect(callback, []);
		return <></>;
	},
	selectedItemsRenderer: () =>
		useConsoleIntegrationStore.getState().enabled
			? [
					<ListboxItem
						className="p-3"
						startContent={<Icon icon="mdi:console" />}
						key="console"
					>
						<Trans>Console</Trans>
					</ListboxItem>,
				]
			: [],
};
