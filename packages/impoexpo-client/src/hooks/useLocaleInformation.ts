import { useState } from "react";
import { type LocaleMetadata, locales } from "@/locales/i18n";
import useLinguiChange from "./useLinguiChange";

export default function useLocaleInformation() {
	const { i18n } = useLinguiChange((i18n) =>
		// biome-ignore lint/style/noNonNullAssertion: only supported locales get loaded into lingui
		setInfo(locales.find((l) => l.id === i18n.locale)!),
	);
	const [info, setInfo] = useState<LocaleMetadata>(
		// biome-ignore lint/style/noNonNullAssertion: only supported locales get loaded into lingui
		locales.find((l) => l.id === i18n.locale)!,
	);

	return info;
}
