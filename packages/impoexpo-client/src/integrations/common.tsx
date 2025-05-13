import { useEffect } from "react";

export function DefaultIntegrationAuthenticator(props: {
	callback: () => void;
}) {
	useEffect(props.callback, []);
	return <></>;
}

export function DefaultIntegrationVerifier(props: {
	successCallback: () => void;
	resetCallback: () => void;
}) {
	useEffect(props.successCallback, []);
	return <></>;
}

export function DefaultIntegrationHydrator(props: {
	init?: () => void;
	callback: () => void;
}) {
	useEffect(() => {
		props.init?.();
		props.callback();
	}, [props]);
	return <></>;
}
