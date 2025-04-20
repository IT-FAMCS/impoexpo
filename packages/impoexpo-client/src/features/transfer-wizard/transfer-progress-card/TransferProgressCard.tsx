import { Card, CircularProgress } from "@heroui/react";
import {
	TransferProgressCardState,
	useTransferProgressCardStore,
} from "./store";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProjectStore } from "@/stores/project";
import {
	ProjectSchema,
	type Project,
} from "@impoexpo/shared/schemas/project/ProjectSchema";
import { postWithSchema } from "@/api/common";
import { UPLOAD_PROJECT_ENDPOINT } from "@impoexpo/shared/schemas/project/endpoints";
import { Trans, useLingui } from "@lingui/react/macro";
import NetworkErrorCard from "@/components/network/NetworkErrorCard";

export default function TransferProgressCard() {
	const { state, setState } = useTransferProgressCardStore();

	const stateComponent = useMemo(() => {
		switch (state) {
			case TransferProgressCardState.UPLOADING_PROJECT:
				return <UploadingProjectCard />;
			case TransferProgressCardState.TRANSFERRING:
				return <></>;
		}
	}, [state]);

	return (
		<Card className="relative flex items-center justify-center w-full h-full">
			{stateComponent}
		</Card>
	);
}

function UploadingProjectCard() {
	const project = useProjectStore() as Project;
	const {
		isFetching,
		isError,
		isRefetchError,
		isSuccess,
		data,
		error,
		refetch,
	} = useQuery({
		queryKey: ["upload-project", project],
		queryFn: async () => postWithSchema(UPLOAD_PROJECT_ENDPOINT, project),
	});
	const { t } = useLingui();

	if (isFetching) {
		return (
			<div className="flex flex-col items-center justify-center gap-2">
				<Trans>uploading your project</Trans>
				<CircularProgress />
			</div>
		);
	}

	if (isError || isRefetchError) {
		return (
			<NetworkErrorCard
				title={t`couldn't upload your project`}
				retry={refetch}
				error={error}
			/>
		);
	}

	if (isSuccess) {
		return <>meow~!</>;
	}
}
