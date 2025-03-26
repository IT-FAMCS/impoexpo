import { getWithSchema } from "@/api/common";
import {
	Button,
	CircularProgress,
	Listbox,
	ListboxItem,
	ScrollShadow,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { FaultyActionSchema } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import {
	GOOGLE_FORMS_LIST_ROUTE,
	GOOGLE_FORMS_VERIFY_ROUTE,
} from "@impoexpo/shared/schemas/integrations/google/forms/endpoints";
import { ListGoogleFormsResponseSchema } from "@impoexpo/shared/schemas/integrations/google/forms/ListGoogleFormsResponseSchema";
import { getGoogleAuthHeaders } from "../common";
import { Icon } from "@iconify/react";
import CacheInfoModal from "@/components/network/CacheInfoModal";
import NetworkErrorCard from "@/components/network/NetworkErrorCard";
import { useEffect, useMemo, useState } from "react";
import { GoogleFormsHydratorState, useGoogleFormsHydratorStore } from "./store";
import {
	SourceCardState,
	useSourceCardStore,
} from "@/stores/select-source-card";

export function GoogleFormsHydrator(props: { callback: () => void }) {
	const { state } = useGoogleFormsHydratorStore();

	switch (state) {
		case GoogleFormsHydratorState.SELECT:
			return <GoogleFormsSelector />;
		case GoogleFormsHydratorState.VERIFY:
			return <GoogleFormsVerificator successCallback={props.callback} />;
	}
}

function GoogleFormsVerificator(props: { successCallback: () => void }) {
	const { currentForm, setCurrentForm, addUsedForm, setState } =
		useGoogleFormsHydratorStore();
	const { isFetching, isError, data, error } = useQuery({
		queryKey: ["verify-google-form-permissions", currentForm?.id],
		refetchOnWindowFocus: false,
		queryFn: () =>
			getWithSchema(GOOGLE_FORMS_VERIFY_ROUTE, FaultyActionSchema, {
				headers: getGoogleAuthHeaders(),
				query: { id: currentForm?.id ?? "" },
			}),
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: props.successCallback does not change
	useEffect(() => {
		if (data?.ok) {
			// biome-ignore lint/style/noNonNullAssertion: guaranteed to not be undefined
			addUsedForm(currentForm!);
			setCurrentForm(undefined);
			setState(GoogleFormsHydratorState.SELECT);
			props.successCallback();
		}
	}, [data]);

	if (isFetching) {
		return (
			<div className="flex flex-col gap-2 justify-center items-center">
				проверяем наличие прав на просмотр формы
				<CircularProgress />
			</div>
		);
	}

	if (isError) {
		return (
			<NetworkErrorCard
				title="не удалось проверить права на чтение формы (либо прав нет)"
				retry={() => setState(GoogleFormsHydratorState.SELECT)}
				retryButtonText="назад к выбору формы"
				error={error}
			/>
		);
	}
}

function GoogleFormsSelector() {
	const { currentForm, usedForms, hasForm, setCurrentForm, setState } =
		useGoogleFormsHydratorStore();
	const { setState: setSourceCardState } = useSourceCardStore();

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: why is usedForms.has() a dependency??
	const allFormsSelected = useMemo(
		() =>
			data === undefined ? undefined : data.every((form) => hasForm(form.id)),
		[data],
	);

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
			<div className="flex flex-col gap-2 justify-center items-center max-w-lg w-full">
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
							setCurrentForm(data.find((f) => f.id === Object.values(sel)[0]));
						}}
						emptyContent={
							<p className="text-center">
								вы уже выбрали все формы!
								<br /> если вы создали новую форму, или получили доступ к другой
								форме, нажмите на кнопку ниже.
							</p>
						}
					>
						{data.map((form) =>
							hasForm(form.id) ? null : (
								<ListboxItem
									className="p-3"
									startContent={<Icon icon="simple-icons:googleforms" />}
									description={form.description}
									key={form.id}
								>
									{form.name}
								</ListboxItem>
							),
						)}
					</Listbox>
				</ScrollShadow>
				<div className="flex flex-row gap-2 justify-center items-center">
					{allFormsSelected && (
						<Button
							onPress={() => setSourceCardState(SourceCardState.SELECT_SOURCE)}
							size="sm"
							color="primary"
							startContent={<Icon icon="mdi:arrow-left" />}
						>
							назад к выбору источников
						</Button>
					)}
					<CacheInfoModal
						className="self-end"
						onRefresh={() => {
							setCurrentForm(undefined);
							if (!bypassCache) setBypassCache(true);
							else refetch();
						}}
					/>
					{currentForm !== undefined && (
						<Button
							onPress={() => {
								if (currentForm !== undefined)
									setState(GoogleFormsHydratorState.VERIFY);
							}}
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
