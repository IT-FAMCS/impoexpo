import { ListboxItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import { usePlaceholderIntegrationStore } from "./store";

import { Trans } from "@lingui/react/macro";
import { registerIntegration } from "../integrations";
import { DefaultIntegrationHydrator } from "../common";

registerIntegration({
	id: "placeholder",
	title: msg`nowhere`,
	icon: <Icon icon="mdi:border-none-variant" />,
	read: false,
	write: true,

	hydrator: (callback) => (
		<DefaultIntegrationHydrator
			init={() => usePlaceholderIntegrationStore.setState({ enabled: true })}
			callback={callback}
		/>
	),
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
