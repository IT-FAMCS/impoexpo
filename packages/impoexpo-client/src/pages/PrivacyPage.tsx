import SwitchesPanel from "@/components/buttons/SwitchesPanel";
import { Button, Card, CardBody, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { useNavigate } from "react-router";

export default function PrivacyPage() {
	const navigate = useNavigate();

	return (
		<div className="flex flex-col justify-center items-center w-screen h-screen gap-4">
			<Card>
				<CardBody className="max-w-[30vw]">
					<p>
						<Trans>
							<span className="text-2xl font-bold">privacy policy</span>
							<br />
							<br />
							impoexpo is a "services aggregator". it allows you to transfer
							data between different services without the need to do the tedious
							work manually. this means that you have to login into such
							services (i.e. google), usually over OAuth2, so that impoexpo can
							perform its function.
							<br />
							<br />
							impoexpo <b>may</b> access personal information like your profile
							picture, email address, and integration-specific information like
							files on your Google Drive for the Google Forms integration.
							<br />
							<b>none</b> of this information is stored on our services, however
							it is encrypted on our servers and stored client-side, which
							(hopefully) prevents any possible attacks via malicious code
							executed on the user's machine.
							<br />
							<br /> the developers have no malicious intent with your data and
							collect as little information as possible so that impoexpo can
							work. if you're unsure or don't trust us, impoexpo is open-source
							software and it's source code can be accessed at
							<Link showAnchorIcon href="https://github.com/IT-FAMCS/impoexpo">
								https://github.com/IT-FAMCS/impoexpo
							</Link>
							.
						</Trans>
					</p>
				</CardBody>
			</Card>
			<Button
				onPress={() => navigate("/")}
				color="primary"
				startContent={<Icon icon="mdi:arrow-left" />}
			>
				<Trans>back</Trans>
			</Button>
			<SwitchesPanel />
		</div>
	);
}
