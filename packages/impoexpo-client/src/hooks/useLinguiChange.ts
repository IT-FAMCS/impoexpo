import { useEffect } from "react";
import { useLingui } from "@lingui/react";
import type { I18n } from "@lingui/core";

export default function useLinguiChange(onChange: (i18n: I18n) => void) {
	const lingui = useLingui();
	useEffect(() => {
		const changeEvent = () => onChange(lingui.i18n);
		lingui.i18n.on("change", changeEvent);
		return () => {
			lingui.i18n.removeListener("change", changeEvent);
		};
	}, [lingui.i18n, onChange]);
	return lingui;
}
