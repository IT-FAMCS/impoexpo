import { useState } from "react";
import {
	type SupportedLocale,
	supportedLocales,
} from "@/locales/supportedLocales";
import useLinguiChange from "./useLinguiChange";

export default function useLocaleInformation() {
	const { i18n } = useLinguiChange((i18n) =>
		// biome-ignore lint/style/noNonNullAssertion: only supported locales get loaded into lingui
		setInfo(supportedLocales.find((l) => l.id === i18n.locale)!),
	);
	const [info, setInfo] = useState<SupportedLocale>(
		// biome-ignore lint/style/noNonNullAssertion: only supported locales get loaded into lingui
		supportedLocales.find((l) => l.id === i18n.locale)!,
	);

	return info;
}
