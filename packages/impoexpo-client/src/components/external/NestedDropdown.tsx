import { useState, type FC, type ReactNode } from "react";
import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	type DropdownItemProps,
	type PopoverProps,
} from "@heroui/react";
import type { CollectionElement } from "@react-types/shared";

export type NestedDropdownPlacement = Required<PopoverProps["placement"]>;

export interface NestedDropdownItemProps
	extends Omit<DropdownItemProps, "children"> {
	key: string;
	label: ReactNode;
	items?: NestedDropdownItemProps[];
	placement?: NestedDropdownPlacement;
}

interface NestedDropdownProps {
	items: NestedDropdownItemProps[];
	trigger: ReactNode;
	placement?: NestedDropdownPlacement;
}

const NestedDropdown: FC<NestedDropdownProps> = ({
	items: rootItems,
	trigger,
	placement: rootPlacement,
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const renderMenuItem = (item: NestedDropdownItemProps): ReactNode => {
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
					renderMenuItem(item) as CollectionElement<NestedDropdownItemProps>
				}
			</DropdownMenu>
		</Dropdown>
	);
};

export default NestedDropdown;
