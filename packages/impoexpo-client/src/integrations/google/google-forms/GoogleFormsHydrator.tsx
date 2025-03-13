import { getWithSchema } from "@/api/common";
import {
	CircularProgress,
	Code,
	Listbox,
	ListboxItem,
	ScrollShadow,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { GOOGLE_FORMS_LIST_ROUTE } from "./endpoints";
import { ListGoogleFormsResponseSchema } from "@impoexpo/shared";
import { getGoogleAuthHeaders } from "../common";
import { Icon } from "@iconify/react";

export function GoogleFormsHydrator() {
	const { isLoading, isError, isSuccess, data, error } = useQuery({
		queryKey: ["receive-google-form-info"],
		queryFn: () =>
			getWithSchema(GOOGLE_FORMS_LIST_ROUTE, ListGoogleFormsResponseSchema, {
				headers: getGoogleAuthHeaders(),
			}),
	});

	if (isLoading) {
		return (
			<div className="flex flex-col gap-2 justify-center items-center">
				получаем список ваших форм
				<CircularProgress />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex flex-col gap-1 justify-center items-center">
				<Icon className="text-danger" width={48} icon="mdi:error-outline" />
				не удалось получить список ваших форм
				<Code>{error.message}</Code>
			</div>
		);
	}

	if (isSuccess) {
		return (
			<div className="flex flex-col gap-2 justify-center items-center w-full">
				выберите форму:
				<ScrollShadow
					className="w-full"
					style={{ maxHeight: "50vh", overflow: "scroll" }}
				>
					<Listbox
						className="border-small rounded-small border-default"
						disallowEmptySelection
						selectionMode="single"
					>
						{data.map((form) => (
							<ListboxItem
								className="p-3"
								startContent={<Icon icon="simple-icons:googleforms" />}
								description={form.description}
								key={form.id}
							>
								{form.name}
							</ListboxItem>
						))}
					</Listbox>
				</ScrollShadow>
			</div>
		);
	}
}
