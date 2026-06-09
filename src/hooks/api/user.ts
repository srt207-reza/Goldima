import { useQuery } from "@tanstack/react-query";
import { getCurrentUser, getUsers } from "@/services/api/user";
import { getAccessToken } from "@/lib/auth-storage";
import type { UsersQueryParams } from "@/types/api/user";

export function useCurrentUserQuery() {
    return useQuery({
        queryKey: ["api", "users", "me"],
        queryFn: getCurrentUser,
        enabled: Boolean(getAccessToken()),
        retry: false,
    });
}

export function useUsersQuery(params?: UsersQueryParams) {
    return useQuery({
        queryKey: ["api", "users", params ?? null],
        queryFn: () => getUsers(params),
    });
}
