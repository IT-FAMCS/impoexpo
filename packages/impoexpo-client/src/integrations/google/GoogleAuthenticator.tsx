import { postWithSchema } from "@/api/common";
import { Button, Card, CircularProgress, Code, User } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

import {
	GOOGLE_EXCHANGE_ROUTE,
	GoogleExchangeResponseSchema,
} from "@impoexpo/shared";
import { useAuthStore } from "@/stores/auth";

export default function GoogleAuthenticator(props: {
	scopes: string[];
	onSuccess: () => void;
}) {
	const { setGoogleAuth } = useAuthStore();

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
						error("не все права были предоставлены!");
					} else if (response.code) {
						setLoadingState("просим сервер обменяться токенами...");

						postWithSchema(
							GOOGLE_EXCHANGE_ROUTE,
							GoogleExchangeResponseSchema,
							{ query: { code: response.code } },
						)
							.then(async (data) => {
								setGoogleAuth(data);
								props.onSuccess();
							})
							.catch((err) => {
								console.error(
									`couldn't exchange tokens with the backend: ${err}`,
								);
								error(
									"не удалось обменяться токенами с сервером (проверьте консоль)",
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
		setLoadingState("ожидаем завершения входа...");
		client?.requestCode();
	};

	if (loadingState === undefined) {
		return (
			<div className="flex flex-col w-full gap-2">
				чтобы продолжить, необходимо войти в ваш аккаунт google.
				{client !== undefined && (
					<Button
						onPress={prompt}
						variant="flat"
						color="primary"
						startContent={<Icon icon="flat-color-icons:google" width={24} />}
					>
						войти в свой google аккаунт
					</Button>
				)}
				{errorMessage !== undefined && (
					<div className="flex flex-row items-center justify-center gap-2 text-small text-danger">
						во время входа произошла ошибка:
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
