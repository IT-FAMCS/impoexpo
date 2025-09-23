export { Page };

import { Trans } from "@lingui/react/macro";
import { usePageContext } from "vike-react/usePageContext";

function Page() {
	const pageContext = usePageContext();
	return (
		<div className="w-full h-full flex justify-center items-center flex-col gap-4">
			{pageContext.is404 ? (
				<p className="font-bold text-9xl">404</p>
			) : (
				<>
					<p className="font-bold text-9xl">:(</p>
					<p className="italic text-2xl">
						<Trans>something went wrong. please try again later.</Trans>
					</p>
				</>
			)}
		</div>
	);
}
