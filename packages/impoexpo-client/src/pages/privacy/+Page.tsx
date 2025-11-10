import { CardBody, Link, Spinner, Tab, Tabs } from "@heroui/react";
import { Trans, useLingui } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Markdown from "react-markdown";
import "../../styles/markdown.css";

import { AnimatedCard } from "@/styles/motion";
export default function Privacy() {
	const [tab, setTab] = useState("privacy");

	return (
		<div className="flex flex-col items-center justify-center w-full h-full min-h-0 gap-4">
			<Tabs
				selectedKey={tab}
				onSelectionChange={(k) => setTab(k.toString())}
				items={[
					{
						id: "privacy",
						label: <Trans>common</Trans>,
					},
					{
						id: "google",
						label: <Trans>google</Trans>,
					},
				]}
			>
				{(item) => (
					<Tab className="min-h-0" id={item.id} title={item.label}>
						<LegalCard id={item.id} />
					</Tab>
				)}
			</Tabs>
		</div>
	);
}

function LegalCard(props: { id: string }) {
	const { i18n } = useLingui();
	const { isLoading, isError, data, error } = useQuery({
		queryKey: ["fetchLegalDocument", props.id, i18n.locale],
		queryFn: async () => {
			const response = await fetch(`/legal/${i18n.locale}/${props.id}.md`);
			if (!response.ok)
				throw new Error(`failed to fetch legal document (${response.status})`);
			return await response.text();
		},
	});

	return (
		<AnimatedCard
			initial={{
				opacity: 0,
				y: 10,
			}}
			animate={{
				opacity: 1,
				y: 0,
			}}
			transition={{
				duration: 0.25,
				ease: [0.83, 0, 0.17, 1],
			}}
			className="max-h-full"
		>
			<CardBody className="xl:max-w-[40vw]">
				{isLoading && <Spinner />}
				{isError && <>{error}</>}
				{data && (
					<div className="markdown">
						<Markdown
							components={{
								a(props) {
									const { href, children } = props;
									return (
										<Link href={href} isExternal showAnchorIcon>
											{children}
										</Link>
									);
								},
							}}
						>
							{data}
						</Markdown>
					</div>
				)}
			</CardBody>
		</AnimatedCard>
	);
}
