import { getWithSchema } from "@/api/common";
import { CircularProgress } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { GOOGLE_FORMS_LIST_ROUTE } from "./endpoints";
import { ListGoogleFormsResponseSchema } from "@impoexpo/shared";
import { useAuthStore } from "@/stores/auth";
import { getGoogleAuthHeaders } from "../common";

export function GoogleFormsHydrator() {
	const { google: auth } = useAuthStore();
	const { isLoading, isError, data, error } = useQuery({
		queryKey: ["receive-google-form-names"],
		queryFn: () =>
			getWithSchema(GOOGLE_FORMS_LIST_ROUTE, ListGoogleFormsResponseSchema, {
				headers: getGoogleAuthHeaders(),
			}),
	});

	if (isLoading) {
		return <CircularProgress />;
	}
}
