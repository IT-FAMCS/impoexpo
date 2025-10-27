import { getWithSchema } from "@/api/common";
import NetworkErrorCard from "@/components/network/NetworkErrorCard";
import {
	SourceCardState,
	useSourceCardStore,
} from "@/features/transfer-wizard/select-source-card/store";
import { Button, Spinner, Alert } from "@heroui/react";
import { Icon } from "@iconify/react";
import { FaultyActionSchema } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";
import { GoogleFormsLayoutSchema } from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsLayoutSchema";
import {
	GOOGLE_FORMS_LAYOUT_ROUTE,
	GOOGLE_FORMS_VERIFY_ROUTE,
} from "@impoexpo/shared/schemas/integrations/google/forms/static";
import { Trans, useLingui } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getGoogleAuthHeaders } from "../common";
import { GoogleFormsHydratorState, useGoogleFormsHydratorStore } from "./store";
import { registerGoogleFormNode } from "./nodes";
import "@googleworkspace/drive-picker-element";
import { msg } from "@lingui/core/macro";
import type { DrivePickerElement } from "@googleworkspace/drive-picker-element";
import type { MessageDescriptor } from "@lingui/core";

export function GoogleFormsHydrator(props: { callback: () => void }) {
	const { state } = useGoogleFormsHydratorStore();

	switch (state) {
		case GoogleFormsHydratorState.SELECT:
			return <GoogleFormsSelector />;
		case GoogleFormsHydratorState.VERIFY:
			return <GoogleFormsVerifier />;
		case GoogleFormsHydratorState.CREATE_LAYOUT_NODE:
			return <GoogleFormsNodeCreator successCallback={props.callback} />;
	}
}

function GoogleFormsNodeCreator(props: { successCallback: () => void }) {
	const { t } = useLingui();
	const { currentForm, setCurrentForm, addUsedForm, setState } =
		useGoogleFormsHydratorStore();
	const { isFetching, isError, data, error } = useQuery({
		queryKey: ["get-google-form-layout", currentForm],
		refetchOnWindowFocus: false,
		queryFn: async () => {
			if (!currentForm)
				throw new Error("cannot get layout of a form that's undefined");

			const layout = await getWithSchema(
				GOOGLE_FORMS_LAYOUT_ROUTE,
				GoogleFormsLayoutSchema,
				{
					headers: await getGoogleAuthHeaders(),
					query: { id: currentForm ?? "" },
				},
			);

			registerGoogleFormNode(currentForm, layout, true);
			addUsedForm(currentForm, layout);

			setCurrentForm(undefined);
			setState(GoogleFormsHydratorState.SELECT);
			props.successCallback();
		},
	});

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

function GoogleFormsVerifier() {
	const { t } = useLingui();
	const { currentForm, setState } = useGoogleFormsHydratorStore();
	const { isFetching, isError, data, error } = useQuery({
		queryKey: ["verify-google-form-permissions", currentForm],
		refetchOnWindowFocus: false,
		queryFn: async () =>
			getWithSchema(GOOGLE_FORMS_VERIFY_ROUTE, FaultyActionSchema, {
				headers: await getGoogleAuthHeaders(),
				query: { id: currentForm ?? "" },
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
	const { t, i18n } = useLingui();
	const [showPicker, setShowPicker] = useState(false);
	const [error, setError] = useState<MessageDescriptor>();
	const pickerRef = (node: DrivePickerElement | null) => {
		if (!node) return;

		node.addEventListener("picker-canceled", () =>
			setError(msg`it seems like you've canceled the file dialog.`),
		);
		node.addEventListener("picker-oauth-error", (e) => {
			console.error(`failed to login via the picker api: ${e}`);
			setError(msg`something went wrong while logging in (check the console).`);
		});
		node.addEventListener("picker-error", (e) => {
			console.error(`failed to select the form with the picker api: ${e}`);
			setError(
				msg`something went wrong with Google's Picker API (check the console).`,
			);
		});
		node.addEventListener("picker-picked", (e) => {
			const response = e.detail as google.picker.ResponseObject;
			const documents = response[google.picker.Response.DOCUMENTS];
			if (!documents || documents.length !== 1) return;
			if (hasForm(documents[0].id)) {
				setError(msg`you have already selected this form before.`);
				return;
			}
			setCurrentForm(documents[0].id);
			setState(GoogleFormsHydratorState.VERIFY);
		});
	};

	return (
		<>
			<div className="flex flex-col items-center justify-center gap-2">
				<p className="text-center">
					<Trans>
						press the button below to select the form.
						<br />
						you may be asked to login again.
					</Trans>
				</p>
				<div className="flex flex-row gap-2">
					<Button
						onPress={() => setSourceCardState(SourceCardState.SELECT_SOURCE)}
						startContent={<Icon icon="mdi:arrow-left" />}
					>
						<Trans>back to source selection</Trans>
					</Button>
					<Button
						onPress={() => {
							if (showPicker) {
								setShowPicker(false);
								queueMicrotask(() => setShowPicker(true));
							} else setShowPicker(true);
							setError(undefined);
						}}
						color="primary"
						startContent={<Icon width={18} icon="mdi:launch" />}
					>
						<Trans>select the form...</Trans>
					</Button>
				</div>
				{error && <Alert color="danger">{t(error)}</Alert>}
			</div>
			{showPicker && (
				<drive-picker
					ref={pickerRef}
					client-id={import.meta.env.VITE_GOOGLE_CLIENT_ID}
					app-id={import.meta.env.VITE_GOOGLE_APP_ID}
					origin={window.location.origin}
					multiselect={false}
					title={t(msg`Select the form you want to process...`)}
					locale={i18n.locale}
				>
					<drive-picker-docs-view view-id="FORMS" />
				</drive-picker>
			)}
		</>
	);
}
