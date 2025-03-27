import { Button } from "@heroui/react";
import { useTheme } from "@heroui/use-theme";
import { Icon } from "@iconify/react";

export default function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	return (
		<Button
			onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
			isIconOnly
			size="sm"
			startContent={
				theme === "dark" ? (
					<Icon width={18} icon="mdi:moon-and-stars" />
				) : (
					<Icon width={18} icon="mdi:white-balance-sunny" />
				)
			}
		/>
	);
}
