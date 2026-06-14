import { useQuery, useMutation } from "@tanstack/react-query";
import {
    getCurrentUser,
    getUsers,
    getUserById,
    updateUser,
    getBusinessProfile,
    updateBusinessProfile,
    normalizeCurrentUserResponse,
    normalizeUsersResponse,
} from "@/services/api/user";
import { getAccessToken } from "@/lib/auth-storage";
import type { ApiUser, BusinessProfile, CurrentUser, CurrentUserResponse, ManagedUser, UsersQueryParams, UsersResponse } from "@/types/api/user";

export function useCurrentUserQuery() {
    return useQuery<CurrentUserResponse, Error, CurrentUser>({
        queryKey: ["api", "users", "me"],
        queryFn: getCurrentUser,
        select: normalizeCurrentUserResponse,
        enabled: Boolean(getAccessToken()),
        retry: false,
    });
}

export function useUsersQuery(params?: UsersQueryParams) {
    return useQuery<UsersResponse, Error, ManagedUser[]>({
        queryKey: ["api", "users", params ?? null],
        queryFn: () => getUsers(params),
        select: normalizeUsersResponse,
    });
}

/**
 * Fetch a single user by id. The query is enabled only when an id is
 * provided (truthy). Use this in dynamic routes to display user
 * information.
 */
export function useUserQuery(userId?: string | number) {
    return useQuery<ManagedUser, Error>({
        queryKey: ["api", "users", userId],
        queryFn: () => getUserById(userId as string),
        enabled: Boolean(userId),
    });
}

/**
 * Mutation hook for updating a user record. This can be used to
 * approve/reject users or change other user attributes. The caller must
 * supply the user identifier and a payload containing the desired
 * changes.
 */
export function useUpdateUserMutation() {
    return useMutation<ApiUser, Error, { userId: string | number; payload: Partial<ApiUser> }>({
        mutationFn: ({ userId, payload }) => updateUser(userId, payload),
    });
}

/**
 * Fetch a business profile by id. Business profiles contain
 * organisation-level details separate from user-level data. The
 * underlying query is enabled only when a profileId is provided.
 */
export function useBusinessProfileQuery(profileId?: number) {
    return useQuery<BusinessProfile, Error>({
        queryKey: ["api", "profiles", profileId],
        queryFn: () => getBusinessProfile(profileId as number),
        enabled: typeof profileId === "number" && !Number.isNaN(profileId),
    });
}

/**
 * Mutation hook for updating a business profile. The caller must supply
 * both the profile identifier and the payload containing updated
 * fields.
 */
export function useUpdateBusinessProfileMutation() {
    return useMutation<BusinessProfile, Error, { profileId: number; payload: Partial<Omit<BusinessProfile, "id" | "user" | "created_at" | "updated_at">> }>({
        mutationFn: ({ profileId, payload }) => updateBusinessProfile(profileId, payload),
    });
}
