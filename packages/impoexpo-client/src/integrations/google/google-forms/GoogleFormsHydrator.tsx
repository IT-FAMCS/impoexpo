import { getWithSchema } from "@/api/common";
import {
	Button,
	CircularProgress,
	Listbox,
	ListboxItem,
	ScrollShadow,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
	GOOGLE_FORMS_LIST_ROUTE,
	ListGoogleFormsResponseSchema,
} from "@impoexpo/shared";
import { getGoogleAuthHeaders } from "../common";
import { Icon } from "@iconify/react";
import CacheInfoModal from "@/components/network/CacheInfoModal";
import NetworkErrorCard from "@/components/network/NetworkErrorCard";
import { useState } from "react";

export function GoogleFormsHydrator() {
	const [selection, setSelection] = useState<string | undefined>(undefined);
	const [bypassCache, setBypassCache] = useState<boolean>(false);
	const {
		isFetching,
		isError,
		isRefetchError,
		isSuccess,
		data,
		error,
		refetch,
	} = useQuery({
		queryKey: ["receive-google-form-info", bypassCache],
		refetchOnWindowFocus: false,
		queryFn: () =>
			getWithSchema(GOOGLE_FORMS_LIST_ROUTE, ListGoogleFormsResponseSchema, {
				headers: getGoogleAuthHeaders(),
				bypassCache: bypassCache,
			}),
	});

	if (isFetching) {
		return (
			<div className="flex flex-col gap-2 justify-center items-center">
				получаем список ваших форм
				<CircularProgress />
			</div>
		);
	}

	if (isError || isRefetchError) {
		return (
			<NetworkErrorCard
				title="не удалось получить список ваших форм"
				retry={refetch}
				error={error}
			/>
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
						onSelectionChange={(sel) => {
							if (sel === "all" || sel.size === 0) return;
							setSelection(Object.keys(sel)[0]);
						}}
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
				<div className="flex flex-row gap-2 justify-center items-center">
					<CacheInfoModal
						className="self-end"
						onRefresh={() => {
							setSelection(undefined);
							if (!bypassCache) setBypassCache(true);
							else refetch();
						}}
					/>
					{selection !== undefined && (
						<Button
							size="sm"
							color="primary"
							endContent={<Icon icon="mdi:arrow-right" />}
						>
							далее
						</Button>
					)}
				</div>
			</div>
		);
	}
}
