import { postWithSchema } from "@/api/common";
import { Button, CircularProgress, Code } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

import { GoogleExchangeResponseSchema } from "@impoexpo/shared/schemas/integrations/google/GoogleExchangeResponseSchema";
import { GOOGLE_EXCHANGE_ROUTE } from "@impoexpo/shared/schemas/integrations/google/endpoints";
import { Trans, useLingui } from "@lingui/react/macro";
import { saveAuthToDatabase } from "@/db/auth";

export default function GoogleAuthenticator(props: {
	scopes: string[];
	onSuccess: () => void;
}) {
	const { t } = useLingui();

	const [client, setClient] = useState<
		google.accounts.oauth2.CodeClient | undefined
	>(undefined);
	const [loadingState, setLoadingState] = useState<string | undefined>(
		undefined,
	);
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);

	const error = (message: string) => {
		setLoadingState(undefined);
		setErrorMessage(message);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: the function "error" doesn't change
	useEffect(() => {
		if (client !== undefined) return;
		setClient(
			google.accounts.oauth2.initCodeClient({
				client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
				scope: props.scopes.join(" "),
				ux_mode: "popup",
				callback(response) {
					if (response.error) {
						error(response.error);
					} else if (
						props.scopes.some(
							(scope) => response.scope.split(" ").indexOf(scope) === -1,
						)
					) {
						error(t`not all permissions have been provided!`);
					} else if (response.code) {
						setLoadingState(t`exchanging tokens with the server`);

						postWithSchema(
							GOOGLE_EXCHANGE_ROUTE,
							GoogleExchangeResponseSchema,
							{ query: { code: response.code } },
						)
							.then(async (data) => {
								saveAuthToDatabase("google", data);
								props.onSuccess();
							})
							.catch((err) => {
								console.error(
									`couldn't exchange tokens with the server: ${err}`,
								);
								error(
									t`couldn't exchange tokens with the server (check the console)`,
								);
							});
					}
				},
				error_callback(err) {
					error(err.message);
				},
			}),
		);
	}, [client, props.scopes]);

	const prompt = () => {
		setErrorMessage(undefined);
		setLoadingState(t`waiting for the login flow response`);
		client?.requestCode();
	};

	if (loadingState === undefined) {
		return (
			<div className="flex flex-col w-full gap-2">
				<Trans>to continue, login with your google account.</Trans>
				{client !== undefined && (
					<Button
						onPress={prompt}
						variant="flat"
						color="primary"
						startContent={<Icon icon="flat-color-icons:google" width={24} />}
					>
						<Trans>login via google</Trans>
					</Button>
				)}
				{errorMessage !== undefined && (
					<div className="flex flex-row items-center justify-center gap-2 text-small text-danger">
						<Trans>an error occurred during login:</Trans>
						<br />
						<Code size="sm" color="danger">
							{errorMessage}
						</Code>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center w-full gap-2">
			<CircularProgress />
			<p className="text-foreground-500">{loadingState}</p>
		</div>
	);
}
