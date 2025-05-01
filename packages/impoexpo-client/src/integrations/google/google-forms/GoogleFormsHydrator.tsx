import { getWithSchema } from "@/api/common";
import CacheInfoModal from "@/components/network/CacheInfoModal";
import NetworkErrorCard from "@/components/network/NetworkErrorCard";
import {
	SourceCardState,
	useSourceCardStore,
} from "@/features/transfer-wizard/select-source-card/store";
import {
	Button,
	Spinner,
	Listbox,
	ListboxItem,
	ScrollShadow,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { FaultyActionSchema } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import { ListGoogleFormsResponseSchema } from "@impoexpo/shared/schemas/integrations/google/forms/ListGoogleFormsResponseSchema";
import { GoogleFormsLayoutSchema } from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsLayoutSchema";
import {
	GOOGLE_FORMS_LAYOUT_ROUTE,
	GOOGLE_FORMS_LIST_ROUTE,
	GOOGLE_FORMS_VERIFY_ROUTE,
} from "@impoexpo/shared/schemas/integrations/google/forms/endpoints";
import { Trans, useLingui } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getGoogleAuthHeaders } from "../common";
import { GoogleFormsHydratorState, useGoogleFormsHydratorStore } from "./store";
import { registerGoogleFormNode } from "./nodes";

export function GoogleFormsHydrator(props: { callback: () => void }) {
	const { state } = useGoogleFormsHydratorStore();

	switch (state) {
		case GoogleFormsHydratorState.SELECT:
			return <GoogleFormsSelector />;
		case GoogleFormsHydratorState.VERIFY:
			return <GoogleFormsVerificator />;
		case GoogleFormsHydratorState.CREATE_LAYOUT_NODE:
			return <GoogleFormsNodeCreator successCallback={props.callback} />;
	}
}

function GoogleFormsNodeCreator(props: { successCallback: () => void }) {
	const { t } = useLingui();
	const { currentForm, setCurrentForm, addUsedForm, setState } =
		useGoogleFormsHydratorStore();
	const { isFetching, isError, data, error } = useQuery({
		queryKey: ["get-google-form-layout", currentForm?.id],
		refetchOnWindowFocus: false,
		queryFn: async () =>
			getWithSchema(GOOGLE_FORMS_LAYOUT_ROUTE, GoogleFormsLayoutSchema, {
				headers: await getGoogleAuthHeaders(),
				query: { id: currentForm?.id ?? "" },
			}),
	});

	useEffect(() => {
		if (data && currentForm) {
			registerGoogleFormNode(currentForm.id, data);
			addUsedForm(currentForm.id, data);

			setCurrentForm(undefined);
			setState(GoogleFormsHydratorState.SELECT);
			props.successCallback();
		}
	}, [
		data,
		addUsedForm,
		setState,
		setCurrentForm,
		currentForm,
		props.successCallback,
	]);

	if (isFetching) {
		return (
			<div className="flex flex-col items-center justify-center gap-2">
				<Trans>receiving the form's layout</Trans>
				<Spinner />
			</div>
		);
	}

	if (isError) {
		return (
			<NetworkErrorCard
				title={t`failed to receive the form's layout (and create a node for it)`}
				retry={() => setState(GoogleFormsHydratorState.SELECT)}
				retryButtonText={t`back to form selection`}
				error={error}
			/>
		);
	}
}

function GoogleFormsVerificator() {
	const { t } = useLingui();
	const { currentForm, setState } = useGoogleFormsHydratorStore();
	const { isFetching, isError, data, error } = useQuery({
		queryKey: ["verify-google-form-permissions", currentForm?.id],
		refetchOnWindowFocus: false,
		queryFn: async () =>
			getWithSchema(GOOGLE_FORMS_VERIFY_ROUTE, FaultyActionSchema, {
				headers: await getGoogleAuthHeaders(),
				query: { id: currentForm?.id ?? "" },
			}),
	});

	useEffect(() => {
		if (data?.ok) setState(GoogleFormsHydratorState.CREATE_LAYOUT_NODE);
	}, [data, setState]);

	if (isFetching) {
		return (
			<div className="flex flex-col items-center justify-center gap-2">
				<Trans>checking read permissions for the form</Trans>
				<Spinner />
			</div>
		);
	}

	if (isError) {
		return (
			<NetworkErrorCard
				title={t`couldn't verify read permissions for the form (or their lack of)`}
				retry={() => setState(GoogleFormsHydratorState.SELECT)}
				retryButtonText={t`back to form selection`}
				error={error}
			/>
		);
	}
}

function GoogleFormsSelector() {
	const { currentForm, hasForm, setCurrentForm, setState } =
		useGoogleFormsHydratorStore();
	const { setState: setSourceCardState } = useSourceCardStore();
	const { t } = useLingui();

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
		queryFn: async () =>
			getWithSchema(GOOGLE_FORMS_LIST_ROUTE, ListGoogleFormsResponseSchema, {
				headers: await getGoogleAuthHeaders(),
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
			<div className="flex flex-col items-center justify-center gap-2">
				<Trans>receiving a list of your forms</Trans>
				<Spinner />
			</div>
		);
	}

	if (isError || isRefetchError) {
		return (
			<NetworkErrorCard
				title={t`couldn't receive a list of your forms`}
				retry={refetch}
				error={error}
			/>
		);
	}

	if (isSuccess) {
		return (
			<div className="flex flex-col items-center justify-center w-full max-w-lg gap-2">
				<Trans>select a form:</Trans>
				<ScrollShadow className="w-full" style={{ maxHeight: "50vh" }}>
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
								<Trans>
									you have already selected all forms!
									<br />
									if you've created a new form, or got access to one, click the
									button below.
								</Trans>
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
				<div className="flex flex-row items-center justify-center gap-2">
					{allFormsSelected && (
						<Button
							onPress={() => setSourceCardState(SourceCardState.SELECT_SOURCE)}
							size="sm"
							color="primary"
							startContent={<Icon icon="mdi:arrow-left" />}
						>
							<Trans>back to source selection</Trans>
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
							<Trans>next</Trans>
						</Button>
					)}
				</div>
			</div>
		);
	}
}
