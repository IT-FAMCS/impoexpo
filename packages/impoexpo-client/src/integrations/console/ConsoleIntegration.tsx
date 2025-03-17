import type { Integration } from "@/types/Integration";
import { Icon } from "@iconify/react";
import { ListboxItem } from "@heroui/react";
import { useConsoleIntegrationStore } from "./store";

export const ConsoleIntegration: Integration = {
	id: "console",
	title: "Консоль",
	icon: <Icon icon="mdi:console" />,
	read: false,
	write: true,
	checkAuthenticated: () => Promise.resolve(true),

	authenticator: (callback) => {
		callback();
		return <></>;
	},
	verificator: (callback) => {
		callback();
		return <></>;
	},
	hydrator: (callback) => {
		useConsoleIntegrationStore.setState({ enabled: true });
		callback();
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
						Консоль
					</ListboxItem>,
				]
			: [],
};
