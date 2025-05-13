import { registerIntegration } from "@/integrations/integrations";
import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import { MicrosoftWordHydrator } from "./MicrosoftWordHydrator";
import { useMicrosoftWordHydratorStore } from "./store";
import { ListboxItem } from "@heroui/react";
import { Trans } from "@lingui/react/macro";

registerIntegration({
	id: "microsoft-word",
	title: msg`Microsoft Word`,
	icon: <Icon icon="mdi:microsoft-word" />,
	read: false,
	write: true,

	hydrator: (callback) => <MicrosoftWordHydrator callback={callback} />,
	selectedItemsRenderer: () =>
		useMicrosoftWordHydratorStore.getState().documents.map((d) => (
			<ListboxItem
				className="p-3"
				startContent={<Icon icon="mdi:microsoft-word" />}
				description={<Trans>Microsoft Word</Trans>}
				key={d.name}
			>
				{d.name}
			</ListboxItem>
		)),
});
