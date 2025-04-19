import { supportedLocales } from "@/locales/supported-locales";
import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useEffect, useMemo } from "react";

export default function LanguageSwitcher() {
	const { i18n } = useLingui();
	const localeInformation = useMemo(
		// biome-ignore lint/style/noNonNullAssertion: pray
		() => supportedLocales.find((l) => l.id === i18n.locale)!,
		[i18n.locale],
	);

	useEffect(() => localStorage.setItem("locale", i18n.locale), [i18n.locale]);

	return (
		<Dropdown>
			<DropdownTrigger>
				<Button size="sm" startContent={localeInformation.icon(18)}>
					{localeInformation.localizedName}
				</Button>
			</DropdownTrigger>
			<DropdownMenu
				selectionMode="single"
				selectedKeys={[i18n.locale]}
				aria-label="language select"
			>
				{supportedLocales.map((locale) => (
					<DropdownItem
						onPress={() => i18n.activate(locale.id)}
						key={locale.id}
						startContent={locale.icon(18)}
					>
						{locale.localizedName}
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);
}
