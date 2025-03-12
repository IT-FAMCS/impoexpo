import { useAuthStore } from "@/stores/auth";
import { Button, Card, User } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function GoogleVerificator(props: {
	onSuccess: () => void;
	onReset: () => void;
}) {
	const { google: auth, resetGoogleAuth } = useAuthStore();

	if (auth === undefined) return <></>;

	return (
		<div className="flex flex-col items-center justify-center gap-3">
			всё верно?
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
					onPress={() => {
						resetGoogleAuth();
						props.onReset();
					}}
					color="danger"
					variant="flat"
					startContent={<Icon width={18} icon="mdi:close" />}
				>
					перезайти
				</Button>
				<Button
					onPress={props.onSuccess}
					color="success"
					variant="flat"
					endContent={<Icon width={18} icon="mdi:arrow-right" />}
				>
					далее
				</Button>
			</div>
		</div>
	);
}
