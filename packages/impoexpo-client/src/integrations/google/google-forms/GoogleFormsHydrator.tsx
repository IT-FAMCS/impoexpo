import { getWithSchema } from "@/api/common";
import { CircularProgress } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { GOOGLE_FORMS_LIST_ROUTE } from "./endpoints";
import { ListGoogleFormsResponseSchema } from "@impoexpo/shared";
import { useAuthStore } from "@/stores/auth";

export function GoogleFormsHydrator() {
	const { google: auth } = useAuthStore();
	const { isLoading, isError, data, error } = useQuery({
		queryKey: ["receive-google-form-names"],
		queryFn: () =>
			getWithSchema(GOOGLE_FORMS_LIST_ROUTE, ListGoogleFormsResponseSchema, {
				authorization: auth?.accessToken,
			}),
	});

	if (isLoading) {
		return <CircularProgress />;
	}
}
