import { Icon } from "@iconify/react";
import { i18n } from "@lingui/core";

export const DEFAULT_LOCALE = "en";

export type LocaleMetadata = {
	id: string;
	fullName: string;
	localizedName: string;
	icon: (size: number) => React.ReactNode;
	oramaMetadata?: Record<string, unknown>;
};

export const locales: LocaleMetadata[] = [
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

export function getCatalogs() {
	const catalogs: Record<string, unknown> = {};
	for (const locale of locales)
		catalogs[locale.id] = import(/* @vite-ignore */ `./${locale.id}.po`);
	return catalogs;
}

export async function activateLocale(localeId: string) {
	if (i18n.locale !== localeId) {
		const { messages } = await import(/* @vite-ignore */ `./${localeId}.po`);
		i18n.loadAndActivate({ locale: localeId, messages });
	}
}
