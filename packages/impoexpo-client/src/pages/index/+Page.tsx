import { Trans } from "@lingui/react/macro";

import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { type ReactNode, useRef, useState } from "react";
import { Link } from "@heroui/react";
gsap.registerPlugin(SplitText, useGSAP);

import LockImage from "./assets/lock.avif";
import GithubImage from "./assets/github.avif";
import NodesImage from "./assets/nodes.avif";
import IntegrationsImage from "./assets/integrations.avif";
import IntegrationsArrowsImage from "./assets/integrations-arrows.avif";

type Slogan = {
	title: ReactNode;
	description: ReactNode;
	graphic: ReactNode;
	waitSeconds: number;
};

const slogans: Slogan[] = [
	{
		title: (
			<Trans>
				<b>impoexpo</b> is a{" "}
				<span className="italic tracking-tight font-pt-serif">
					data transfer automation tool
				</span>
			</Trans>
		),
		description: (
			<Trans>
				impoexpo allows one to easily transfer data between unrelated services,
				without the need to copy & paste a million times.
			</Trans>
		),
		graphic: (
			<div className="relative flex items-center justify-center w-full h-full pt-4 xl:pt-0">
				<img
					src={IntegrationsImage}
					className="absolute"
					alt="integrations example"
				/>
				<img
					src={IntegrationsArrowsImage}
					className="absolute dark:invert"
					alt="integrations example"
				/>
			</div>
		),
		waitSeconds: 5,
	},
	{
		title: (
			<Trans>
				<b>impoexpo</b> is a{" "}
				<span className="italic tracking-tight font-pt-serif">
					node-based editor
				</span>
			</Trans>
		),
		description: (
			<Trans>
				see how and where your data flows. we provide more than 50 nodes for
				transforming and filtering data.
			</Trans>
		),
		graphic: (
			<img
				src={NodesImage}
				className="w-full h-full"
				alt="an example of a node graph"
			/>
		),
		waitSeconds: 5,
	},
	{
		title: (
			<Trans>
				<b>impoexpo</b> is
				<span className="italic tracking-tight font-pt-serif"> secure</span>
				<br />
				<span className="block mt-4 text-3xl italic tracking-tight font-pt-serif">
					{" "}
					(we think)
				</span>
			</Trans>
		),
		description: (
			<Trans>
				we don't store personal data on our servers, instead we encrypt it and
				store it client-side. this should (hopefully) prevent any leakage via
				malicious code execution.
				<br />
				we would love to be proven wrong, though.
			</Trans>
		),
		graphic: (
			<img
				src={LockImage}
				className="w-full h-full scale-75"
				alt="lock graphic"
			/>
		),
		waitSeconds: 10,
	},
	{
		title: (
			<Trans>
				<b>impoexpo</b> is{" "}
				<span className="italic tracking-tight font-pt-serif">open-source</span>
			</Trans>
		),
		description: (
			<Trans>
				the source code for impoexpo is hosted on github and can be found{" "}
				<Link
					className="text-xl underline xl:text-2xl"
					color="foreground"
					href="https://github.com/IT-FAMCS/impoexpo"
					isExternal
					showAnchorIcon
				>
					<Trans>here</Trans>
				</Link>
				.
			</Trans>
		),
		graphic: (
			<img
				src={GithubImage}
				className="w-full h-full scale-75 invert dark:invert-0"
				alt="github logo"
			/>
		),
		waitSeconds: 5,
	},
];

export default function Index() {
	const titleRef = useRef<HTMLParagraphElement>(null!);
	const descriptionRef = useRef<HTMLParagraphElement>(null!);
	const graphicRef = useRef<HTMLDivElement>(null!);
	const [sloganIndex, setSloganIndex] = useState(0);

	useGSAP(() => {
		const animate = async () => {
			const imagesLoaded = Promise.allSettled(
				Array.from(document.images).map((img) => {
					if (img.complete) return Promise.resolve();
					return new Promise((resolve, reject) => {
						img.addEventListener("load", resolve);
						img.addEventListener("error", () => reject(img));
					});
				}),
			);

			SplitText.create(titleRef.current, {
				type: "words,lines",
				mask: "words",
				linesClass: "not-first:-mt-4",
				onSplit: async (titleSelf) => {
					gsap.set(titleSelf.words, { yPercent: 110 });
					await imagesLoaded;

					return gsap.to(titleSelf.words, {
						yPercent: 0,
						duration: 3 - 0.15 * (titleSelf.words.length - 1),
						stagger: 0.15,
						ease: "power4.inOut",
						onComplete: () => {
							gsap.to(titleSelf.words, {
								yPercent: -110,
								duration: 1,
								ease: "power4.inOut",
								delay: slogans[sloganIndex].waitSeconds + 2,
								onComplete: () =>
									setSloganIndex(
										sloganIndex >= slogans.length - 1 ? 0 : sloganIndex + 1,
									),
							});
						},
					});
				},
			});

			SplitText.create(descriptionRef.current, {
				type: "lines",
				mask: "lines",
				onSplit: async (descriptionSelf) => {
					gsap.set(descriptionSelf.lines, { yPercent: 110 });
					await imagesLoaded;

					return gsap.to(descriptionSelf.lines, {
						yPercent: 0,
						duration: 2 - 0.15 * (descriptionSelf.lines.length - 1),
						delay: 3,
						stagger: 0.15,
						ease: "power4.inOut",
						onComplete: () => {
							gsap.to(descriptionSelf.lines, {
								yPercent: -110,
								duration: 1,
								ease: "power4.inOut",
								delay: slogans[sloganIndex].waitSeconds,
							});
						},
					});
				},
			});

			await imagesLoaded;
			gsap.fromTo(
				graphicRef.current,
				{
					yPercent: 10,
					opacity: 0,
				},
				{
					yPercent: 0,
					opacity: 1,
					duration: 2,
					ease: "power4.inOut",
					onComplete: () => {
						gsap.to(graphicRef.current, {
							yPercent: -10,
							opacity: 0,
							duration: 1,
							ease: "power4.inOut",
							delay: slogans[sloganIndex].waitSeconds + 3,
						});
					},
				},
			);
		};

		if (document.fonts.status === "loaded") queueMicrotask(animate);
		else
			document.fonts.addEventListener("loadingdone", () =>
				queueMicrotask(animate),
			);
	}, [sloganIndex]);

	return (
		<div className="flex items-center justify-center w-full h-[calc(100vh_-_8.5rem)]">
			<div className="flex flex-col-reverse h-full xl:flex-row  items-center justify-center gap-10 xl:w-[80%] xl:h-[80%]">
				<div key={sloganIndex} className="flex flex-col gap-4 xl:flex-1">
					<p
						className="text-4xl leading-14 xl:text-6xl xl:leading-20"
						ref={titleRef}
					>
						{slogans[sloganIndex].title}
					</p>
					<p className="text-xl xl:text-2xl" ref={descriptionRef}>
						{slogans[sloganIndex].description}
					</p>
				</div>
				<div className="max-h-[50%] xl:max-h-full w-full h-full xl:flex-1 [&_img]:object-contain">
					<div
						className="flex items-center justify-center w-full h-full opacity-0"
						ref={graphicRef}
					>
						{slogans[sloganIndex].graphic}
					</div>
				</div>
			</div>
		</div>
	);
}
