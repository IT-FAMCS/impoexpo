import { Icon } from "@iconify/react";

export type SupportedLocale = {
	id: string;
	fullName: string;
	localizedName: string;
	icon: (size: number) => React.ReactNode;
	oramaMetadata?: Record<string, unknown>;
};

export const supportedLocales: SupportedLocale[] = [
	{
		id: "ru",
		fullName: "russian",
		localizedName: "русский",
		icon: (size) => <Icon width={size} icon="circle-flags:ru" />,
		oramaMetadata: await import("@orama/stemmers/russian"),
	},
	{
		id: "en",
		fullName: "english",
		localizedName: "english",
		icon: (size) => <Icon width={size} icon="circle-flags:uk" />,
		oramaMetadata: await import("@orama/stemmers/english"),
	},
];
