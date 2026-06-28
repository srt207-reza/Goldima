import { useQuery, useMutation } from "@tanstack/react-query";
import {
    getCurrentUser,
    getUsers,
    getUserById,
    updateUser,
    getBusinessProfile,
    getParentBusinessProfile,
    searchBusinessProfiles,
    updateBusinessProfile,
    normalizeCurrentUserResponse,
    normalizeUsersResponse,
} from "@/services/api/user";
import { getAccessToken, getRefreshToken } from "@/lib/auth-storage";
import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import type { ApiUser, BusinessProfile, BusinessProfileUpdatePayload, CurrentUser, CurrentUserResponse, ManagedUser, PublicBusinessProfile, UsersQueryParams, UsersResponse } from "@/types/api/user";

function getQueryErrorStatus(error: Error): number | undefined {
    const maybeAxiosError = error as Error & {
        response?: {
            status?: number;
        };
    };

    return maybeAxiosError.response?.status;
}

export function useCurrentUserQuery() {
    return useQuery<CurrentUserResponse, Error, CurrentUser>({
        queryKey: ["api", "users", "me"],
        queryFn: getCurrentUser,
        select: normalizeCurrentUserResponse,
        enabled: Boolean(getAccessToken() || getRefreshToken()),
        retry: (failureCount, error) => {
            const status = getQueryErrorStatus(error);

            if (status === 401 || status === 403) {
                return false;
            }

            return failureCount < 2;
        },
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
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

export function useParentBusinessProfileQuery(businessHandler?: string) {
    const normalizedHandler = normalizeBusinessPathSegment(businessHandler);
    const shouldFetch = Boolean(normalizedHandler && normalizedHandler !== DEFAULT_PARENT_BUSINESS_HANDLER);

    return useQuery<PublicBusinessProfile, Error>({
        queryKey: ["api", "users", "parent_profile", normalizedHandler],
        queryFn: () => getParentBusinessProfile(normalizedHandler),
        enabled: shouldFetch,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
}

export function useBusinessProfileSearchQuery(q: string, enabled = true) {
    const query = q.trim();

    return useQuery<BusinessProfile[], Error>({
        queryKey: ["api", "business-profile", "search", query],
        queryFn: () => searchBusinessProfiles(query),
        enabled: enabled && query.length >= 2,
        staleTime: 60 * 1000,
    });
}

/**
 * Mutation hook for updating a business profile. The caller must supply
 * both the profile identifier and the payload containing updated
 * fields.
 */
export function useUpdateBusinessProfileMutation() {
    return useMutation<BusinessProfile, Error, { profileId: number; payload: BusinessProfileUpdatePayload }>({
        mutationFn: ({ profileId, payload }) => updateBusinessProfile(profileId, payload),
    });
}
