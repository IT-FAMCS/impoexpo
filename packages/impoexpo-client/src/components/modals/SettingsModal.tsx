import {
	Button,
	Card,
	CardBody,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Switch,
	useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans, useLingui } from "@lingui/react/macro";
import type { PropsWithChildren, ReactNode } from "react";
import LanguageSwitcher from "../buttons/LanguageSwitcher";
import ThemeSwitcher from "../buttons/ThemeSwitcher";
import { useSettingsStore } from "@/stores/settings";
import DividerWithText from "../external/DividerWithText";

export default function SettingsModal(props: {
	trigger?: (onOpen: () => void) => ReactNode;
}) {
	const { isOpen, onOpen, onOpenChange } = useDisclosure({
		id: "SETTINGS_MODAL",
	});
	const { t } = useLingui();
	const settings = useSettingsStore();

	return (
		<>
			{props.trigger?.(onOpen)}
			<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
				<ModalContent>
					{() => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<Trans>settings</Trans>
							</ModalHeader>
							<ModalBody className="flex flex-col gap-4">
								<SettingsModalSection title={t`general`}>
									<SettingsModalItem title={t`language`}>
										<LanguageSwitcher />
									</SettingsModalItem>
									<SettingsModalItem title={t`theme`}>
										<ThemeSwitcher />
									</SettingsModalItem>
								</SettingsModalSection>
								<SettingsModalSection title={t`editor options`}>
									<SettingsModalItem
										title={t`show a "what does it do?" button near nodes`}
										description={t`will open the documentation for the selected node`}
									>
										<Switch
											isSelected={settings.editor.showDocumentationButton}
											onValueChange={(v) =>
												settings.put("editor.showDocumentationButton", v)
											}
										/>
									</SettingsModalItem>
									<SettingsModalItem
										title={t`debug`}
										description={t`shows additional information about the editor, useful for debugging`}
									>
										<Switch
											isSelected={settings.editor.debug}
											onValueChange={(v) => settings.put("editor.debug", v)}
										/>
									</SettingsModalItem>
								</SettingsModalSection>
								<SettingsModalSection title={t`developer options`}>
									<SettingsModalItem
										title={t`allow taking screenshots of nodes`}
										description={t`used for writing documentation`}
									>
										<Switch
											isSelected={settings.developer.nodeScreenshots}
											onValueChange={(v) =>
												settings.put("developer.nodeScreenshots", v)
											}
										/>
									</SettingsModalItem>
									<SettingsModalItem title={t`always show types`}>
										<Switch
											isSelected={settings.developer.alwaysShowTypes}
											onValueChange={(v) =>
												settings.put("developer.alwaysShowTypes", v)
											}
										/>
									</SettingsModalItem>
								</SettingsModalSection>
							</ModalBody>
							<ModalFooter />
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}

function SettingsModalSection(props: PropsWithChildren<{ title: ReactNode }>) {
	return (
		<div>
			<DividerWithText>{props.title}</DividerWithText>
			<div className="flex flex-col gap-2 mt-2">{props.children}</div>
		</div>
	);
}

function SettingsModalItem(
	props: PropsWithChildren<{ title: ReactNode; description?: ReactNode }>,
) {
	return (
		<Card>
			<CardBody className="flex flex-row items-center justify-between gap-4 px-4 py-2">
				<div>
					<p>{props.title}</p>
					<p className="text-sm text-foreground-500">{props.description}</p>
				</div>
				{props.children}
			</CardBody>
		</Card>
	);
}
