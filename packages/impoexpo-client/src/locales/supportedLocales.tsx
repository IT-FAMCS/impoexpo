import { Icon } from "@iconify/react";

export type SupportedLocale = {
	id: string;
	fullName: string;
	localizedName: string;
	icon: (size: number) => React.ReactNode;
};

export const supportedLocales: SupportedLocale[] = [
	{
		id: "ru",
		fullName: "russian",
		localizedName: "русский",
		icon: (size) => <Icon width={size} icon="circle-flags:ru" />,
	},
	{
		id: "en",
		fullName: "english",
		localizedName: "english",
		icon: (size) => <Icon width={size} icon="circle-flags:uk" />,
	},
];
