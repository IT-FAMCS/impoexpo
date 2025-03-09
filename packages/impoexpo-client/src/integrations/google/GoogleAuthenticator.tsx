import { route } from "@/api/common";
import { Button, CircularProgress, Code } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

export default function GoogleAuthenticator(props: {
	scopes: string[];
}) {
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
						fetch(
							route("/integration/google/exchange", { code: response.code }),
							{ method: "POST" },
						).then((response) => {
							if (response.status !== 200) {
								console.error(
									`failed to exchange tokens with the backend (${response.status}): ${response.body}`,
								);
								error(
									`от сервера был получен неуспешный HTTP код (${response.status})`,
								);
								return;
							}

							response.json().then((jsonResponse) => {
								console.log(jsonResponse); // TODO
							});
						});
					}
				},
				error_callback(error) {
					setErrorMessage(error.message);
					setLoadingState(undefined);
				},
			}),
		);
	}, [client, props.scopes]);

	const prompt = () => {
		setErrorMessage(undefined);
		setLoadingState("ожидаем завершения входа...");
		client?.requestCode();
	};

	return loadingState === undefined ? (
		<div className="w-full flex flex-col gap-2">
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
				<div className="flex flex-row gap-2 justify-center items-center text-small text-danger">
					во время входа произошла ошибка:
					<br />
					<Code size="sm" color="danger">
						{errorMessage}
					</Code>
				</div>
			)}
		</div>
	) : (
		<div className="w-full flex flex-col gap-2 justify-center items-center">
			<CircularProgress />
			<p className="text-foreground-500">{loadingState}</p>
		</div>
	);
}
