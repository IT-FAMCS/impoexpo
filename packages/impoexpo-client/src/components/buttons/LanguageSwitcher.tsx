import { locales } from "@/locales/i18n";
import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useEffect } from "react";
import { usePageContext } from "vike-react/usePageContext";

export default function LanguageSwitcher() {
	const ctx = usePageContext();
	const { i18n } = useLingui();
	// biome-ignore lint/style/noNonNullAssertion: pray
	const localeInformation = locales.find((l) => l.id === i18n.locale)!;

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
				{locales.map((locale) => (
					<DropdownItem
						onPress={() => {
							i18n.activate(locale.id);
							if (ctx.urlPathname === "/") window.location.reload();
						}}
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
