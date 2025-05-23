"use client";

import type { ButtonProps } from "@heroui/react";
import type { ComponentProps } from "react";

import { cn } from "@heroui/react";
import { useControlledState } from "@react-stately/utils";
import { LazyMotion, domAnimation, m } from "motion/react";

import React from "react";

export type ColumnStepProps = {
	title?: React.ReactNode;
	description?: React.ReactNode;
	className?: string;
};

export interface ColumnStepsProps
	extends React.HTMLAttributes<HTMLButtonElement> {
	/**
	 * An array of steps.
	 *
	 * @default []
	 */
	steps?: ColumnStepProps[];
	/**
	 * The color of the steps.
	 *
	 * @default "primary"
	 */
	color?: ButtonProps["color"];
	/**
	 * The current step index.
	 */
	currentStep?: number;
	/**
	 * The default step index.
	 *
	 * @default 0
	 */
	defaultStep?: number;
	/**
	 * Whether to hide the progress bars.
	 *
	 * @default false
	 */
	hideProgressBars?: boolean;
	/**
	 * The custom class for the steps wrapper.
	 */
	className?: string;
	/**
	 * The custom class for the step.
	 */
	stepClassName?: string;
	/**
	 * Callback function when the step index changes.
	 */
	onStepChange?: (stepIndex: number) => void;
}

function CheckIcon(props: ComponentProps<"svg">) {
	return (
		<svg
			{...props}
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			viewBox="0 0 24 24"
		>
			<title>checkbox</title>
			<m.path
				animate={{ pathLength: 1 }}
				d="M5 13l4 4L19 7"
				initial={{ pathLength: 0 }}
				strokeLinecap="round"
				strokeLinejoin="round"
				transition={{
					delay: 0.2,
					type: "tween",
					ease: "easeOut",
					duration: 0.3,
				}}
			/>
		</svg>
	);
}

const ColumnSteps = React.forwardRef<HTMLButtonElement, ColumnStepsProps>(
	(
		{
			color = "primary",
			steps = [],
			defaultStep = 0,
			onStepChange,
			currentStep: currentStepProp,
			hideProgressBars = false,
			stepClassName,
			className,
			...props
		},
		ref,
	) => {
		const [currentStep, setCurrentStep] = useControlledState(
			currentStepProp,
			defaultStep,
			onStepChange,
		);

		const colors = React.useMemo(() => {
			let userColor: string;
			let fgColor: string;

			const colorsVars = [
				"[--active-fg-color:var(--step-fg-color)]",
				"[--active-border-color:var(--step-color)]",
				"[--active-color:var(--step-color)]",
				"[--complete-background-color:var(--step-color)]",
				"[--complete-border-color:var(--step-color)]",
				"[--inactive-border-color:hsl(var(--heroui-default-300))]",
				"[--inactive-color:hsl(var(--heroui-default-300))]",
			];

			switch (color) {
				case "primary":
					userColor = "[--step-color:hsl(var(--heroui-primary))]";
					fgColor = "[--step-fg-color:hsl(var(--heroui-primary-foreground))]";
					break;
				case "secondary":
					userColor = "[--step-color:hsl(var(--heroui-secondary))]";
					fgColor = "[--step-fg-color:hsl(var(--heroui-secondary-foreground))]";
					break;
				case "success":
					userColor = "[--step-color:hsl(var(--heroui-success))]";
					fgColor = "[--step-fg-color:hsl(var(--heroui-success-foreground))]";
					break;
				case "warning":
					userColor = "[--step-color:hsl(var(--heroui-warning))]";
					fgColor = "[--step-fg-color:hsl(var(--heroui-warning-foreground))]";
					break;
				case "danger":
					userColor = "[--step-color:hsl(var(--heroui-error))]";
					fgColor = "[--step-fg-color:hsl(var(--heroui-error-foreground))]";
					break;
				case "default":
					userColor = "[--step-color:hsl(var(--heroui-default))]";
					fgColor = "[--step-fg-color:hsl(var(--heroui-default-foreground))]";
					break;
				default:
					userColor = "[--step-color:hsl(var(--heroui-primary))]";
					fgColor = "[--step-fg-color:hsl(var(--heroui-primary-foreground))]";
					break;
			}

			if (!className?.includes("--step-fg-color")) colorsVars.unshift(fgColor);
			if (!className?.includes("--step-color")) colorsVars.unshift(userColor);
			if (!className?.includes("--inactive-bar-color"))
				colorsVars.push(
					"[--inactive-bar-color:hsl(var(--heroui-default-300))]",
				);

			return colorsVars;
		}, [color, className]);

		return (
			<nav
				aria-label="Progress"
				className="-my-4 max-w-fit overflow-x-auto py-4"
			>
				<ol
					className={cn("flex flex-col flex-nowrap gap-x-3", colors, className)}
				>
					{steps?.map((step, stepIdx) => {
						const status =
							currentStep === stepIdx
								? "active"
								: currentStep < stepIdx
									? "inactive"
									: "complete";
						return (
							<div key={stepIdx} className="flex flex-col px-4">
								<li key={stepIdx} className="relative flex w-full items-center">
									<button
										key={stepIdx}
										ref={ref}
										aria-current={status === "active" ? "step" : undefined}
										className={cn(
											"group cursor-default flex w-full flex-row items-center justify-center gap-x-3 rounded-large py-2.5",
											stepClassName,
											{
												"cursor-pointer": stepIdx <= currentStep,
											},
										)}
										onClick={() => onStepChange?.(stepIdx)}
										{...props}
									>
										<div className="h-ful relative flex flex-col items-center">
											<LazyMotion features={domAnimation}>
												<m.div animate={status} className="relative">
													<m.div
														className={cn(
															"relative flex h-[34px] w-[34px] items-center justify-center rounded-full border-medium text-large font-semibold text-default-foreground",
															{
																"shadow-lg": status === "complete",
															},
														)}
														initial={false}
														transition={{ duration: 0.25 }}
														variants={{
															inactive: {
																backgroundColor: "transparent",
																borderColor: "var(--inactive-border-color)",
																color: "var(--inactive-color)",
															},
															active: {
																backgroundColor: "transparent",
																borderColor: "var(--active-border-color)",
																color: "var(--active-color)",
															},
															complete: {
																backgroundColor:
																	"var(--complete-background-color)",
																borderColor: "var(--complete-border-color)",
															},
														}}
													>
														<div className="flex items-center justify-center">
															{status === "complete" ? (
																<CheckIcon className="h-6 w-6 text-[var(--active-fg-color)]" />
															) : (
																<span>{stepIdx + 1}</span>
															)}
														</div>
													</m.div>
												</m.div>
											</LazyMotion>
										</div>
										<div className="max-w-full flex-1 flex flex-col text-start">
											<div
												className={cn(
													"text-small font-medium text-default-foreground transition-[color,opacity] duration-300 group-active:opacity-80 lg:text-medium",
													{
														"text-default-500": status === "inactive",
													},
												)}
											>
												{step.title}
											</div>
											{step.description !== undefined && (
												<div
													className={cn(
														"text-tiny text-default-500 transition-[color,opacity] duration-300 group-active:opacity-80 lg:text-small",
														{
															"text-default-500": status === "inactive",
														},
													)}
												>
													{step.description}
												</div>
											)}
										</div>
									</button>
								</li>
								{stepIdx < steps.length - 1 && !hideProgressBars && (
									<div
										aria-hidden="true"
										className="pointer-events-none pl-4 h-10 flex-none items-center"
										style={{
											// @ts-ignore
											"--idx": stepIdx,
										}}
									>
										<div
											className={cn(
												"relative h-full w-0.5 bg-[var(--inactive-bar-color)] transition-colors duration-300",
												"after:absolute after:block after:h-0 after:w-full after:bg-[var(--active-border-color)] after:transition-[height] after:duration-300 after:content-['']",
												{
													"after:h-full": stepIdx < currentStep,
												},
											)}
										/>
									</div>
								)}
							</div>
						);
					})}
				</ol>
			</nav>
		);
	},
);

ColumnSteps.displayName = "RowSteps";

export default ColumnSteps;
