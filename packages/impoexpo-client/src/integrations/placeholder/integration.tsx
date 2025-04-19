import { ListboxItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import { useEffect } from "react";
import { usePlaceholderIntegrationStore } from "./store";

import { Trans } from "@lingui/react/macro";
import { registerIntegration } from "../integrations";

registerIntegration({
	id: "placeholder",
	title: msg`Nowhere`,
	icon: <Icon icon="mdi:border-none-variant" />,
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
		usePlaceholderIntegrationStore.setState({ enabled: true });
		useEffect(callback, []);
		return <></>;
	},
	selectedItemsRenderer: () =>
		usePlaceholderIntegrationStore.getState().enabled
			? [
					<ListboxItem
						className="p-3"
						startContent={<Icon icon="mdi:border-none-variant" />}
						key="placeholder"
					>
						<Trans>Nowhere</Trans>
					</ListboxItem>,
				]
			: [],
});
