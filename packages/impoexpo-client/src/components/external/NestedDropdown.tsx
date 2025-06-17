import { useState, type FC, type ReactNode } from "react";
import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	type DropdownItemProps,
	type PopoverProps,
	DropdownSection,
	type DropdownSectionProps,
} from "@heroui/react";
import type { CollectionElement, ItemElement } from "@react-types/shared";

export type NestedDropdownPlacement = Required<PopoverProps["placement"]>;

export interface NestedDropdownItemProps
	extends Omit<DropdownItemProps, "children" | "items" | "key"> {
	key: string;
	label: ReactNode;
	items?: NestedDropdownItemProps[];
	placement?: NestedDropdownPlacement;
}

export interface NestedDropdownSectionProps
	extends Omit<DropdownSectionProps, "children" | "items" | "key"> {
	key: string;
	items?: NestedDropdownItemProps[];
}

export type NestedDropdownChildProps =
	| NestedDropdownItemProps
	| NestedDropdownSectionProps;

const isSection = (
	obj: NestedDropdownChildProps,
): obj is NestedDropdownSectionProps => "showDivider" in obj;

interface NestedDropdownProps {
	items: NestedDropdownChildProps[];
	trigger: ReactNode;
	placement?: NestedDropdownPlacement;
}

const NestedDropdown: FC<NestedDropdownProps> = ({
	items: rootItems,
	trigger,
	placement: rootPlacement,
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const renderMenuItem = (item: NestedDropdownChildProps): ReactNode => {
		if (isSection(item)) {
			const { key, items, ...rest } = item;
			return (
				<DropdownSection {...rest} key={key} items={items}>
					{(item) =>
						renderMenuItem(item) as ItemElement<NestedDropdownItemProps>
					}
				</DropdownSection>
			);
		}

		const { key, label, items, placement, ...rest } = item;
		if (items) {
			return (
				<DropdownItem key={key} closeOnSelect={false}>
					<NestedDropdown
						placement={placement}
						trigger={
							<div className="flex items-center justify-between gap-2 w-full">
								{rest.startContent}
								<span className="flex-grow">{label}</span>
								{rest.endContent}
							</div>
						}
						items={items}
					/>
				</DropdownItem>
			);
		}

		return (
			<DropdownItem key={key} {...rest}>
				{label}
			</DropdownItem>
		);
	};

	return (
		<Dropdown
			placement={rootPlacement}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<DropdownTrigger asChild>{trigger}</DropdownTrigger>
			<DropdownMenu
				closeOnSelect={false}
				items={rootItems}
				onAction={(key) => {
					if (rootItems.find((i) => i.key === key && i.items === undefined)) {
						setIsOpen(false);
					}
				}}
			>
				{(item) =>
					renderMenuItem(item) as CollectionElement<NestedDropdownChildProps>
				}
			</DropdownMenu>
		</Dropdown>
	);
};

export default NestedDropdown;
