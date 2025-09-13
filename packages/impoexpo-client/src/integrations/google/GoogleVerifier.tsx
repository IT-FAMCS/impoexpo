import { getAuthFromDatabase, removeAuthFromDatabase } from "@/db/auth";
import { Button, Card, User } from "@heroui/react";
import { Icon } from "@iconify/react";
import { GoogleExchangeResponseSchema } from "@impoexpo/shared/schemas/integrations/google/GoogleExchangeResponseSchema";
import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";

export default function GoogleVerifier(props: {
	onSuccess: () => void;
	onReset: () => void;
}) {
	const getGoogleAuthQuery = useQuery({
		queryKey: ["get-google-auth"],
		queryFn: async () =>
			(await getAuthFromDatabase("google", GoogleExchangeResponseSchema)) ??
			null,
		refetchOnWindowFocus: false,
	});

	if (getGoogleAuthQuery.isLoading || !getGoogleAuthQuery.data) return <></>;

	// biome-ignore lint/style/noNonNullAssertion: checked above
	const auth = getGoogleAuthQuery.data!;

	return (
		<div className="flex flex-col items-center justify-center gap-3">
			<Trans>is this you?</Trans>
			<Card className="p-4" shadow="sm">
				<User
					classNames={{ wrapper: "ml-2" }}
					avatarProps={{
						showFallback: true,
						isBordered: true,
						size: "md",
						src: auth.profilePicture,
					}}
					name={auth.username}
					description={auth.email}
				/>
			</Card>
			<div className="flex flex-row items-center justify-center gap-2">
				<Button
					onPress={async () => {
						await removeAuthFromDatabase("google");
						props.onReset();
					}}
					color="danger"
					variant="flat"
					startContent={<Icon width={18} icon="mdi:close" />}
				>
					<Trans>relogin</Trans>
				</Button>
				<Button
					onPress={props.onSuccess}
					color="success"
					variant="flat"
					endContent={<Icon width={18} icon="mdi:arrow-right" />}
				>
					<Trans>next</Trans>
				</Button>
			</div>
		</div>
	);
}
