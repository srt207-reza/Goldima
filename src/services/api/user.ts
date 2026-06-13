import { axiosInstance } from "@/lib/axios";
import type { ApiUser, CurrentUserResponse, UsersQueryParams, UsersResponse } from "@/types/api/user";

export async function getUsers(params?: UsersQueryParams): Promise<UsersResponse> {
    const { data } = await axiosInstance.get<UsersResponse>("/api/users/", { params });
    return data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
    const { data } = await axiosInstance.get<ApiUser>("/api/users/me/");
    return data;
}

/**
 * Retrieve a single user by their identifier. The backend returns the
 * user record if found or a 404 error otherwise. Authentication is
 * required.
 *
 * @param userId Primary key or UUID of the user to fetch.
 */
export async function getUserById(userId: string | number): Promise<ApiUser> {
    const { data } = await axiosInstance.get<ApiUser>(`/api/users/${userId}/`);
    return data;
}

/**
 * Update a user record. Only privileged roles (e.g., the reference user)
 * are expected to call this endpoint. The payload can include any
 * mutable fields defined on the ApiUser type. Note that the backend
 * requires the path parameter as the canonical identifier.
 *
 * @param userId Identifier of the user to update.
 * @param payload Partial set of fields to update on the user.
 */
export async function updateUser(userId: string | number, payload: Partial<ApiUser>): Promise<ApiUser> {
    const { data } = await axiosInstance.put<ApiUser>(`/api/users/${userId}/`, payload);
    return data;
}

/**
 * Retrieve a business profile by its identifier. A profile record may
 * contain additional company-specific details such as business name,
 * address or telephone. See the OpenAPI documentation for the full
 * schema. Unknown fields are preserved.
 *
 * @param profileId Identifier of the profile to fetch.
 */
export async function getBusinessProfile(profileId: number): Promise<Record<string, unknown>> {
    const { data } = await axiosInstance.get<Record<string, unknown>>(`/api/users/profile/${profileId}/`);
    return data;
}

/**
 * Update a business profile record. Only privileged roles should call
 * this endpoint. The payload may include any mutable profile fields
 * supported by the backend.
 *
 * @param profileId Identifier of the profile to update.
 * @param payload Partial set of fields to update on the profile.
 */
export async function updateBusinessProfile(profileId: number, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await axiosInstance.put<Record<string, unknown>>(`/api/users/profile/${profileId}/`, payload);
    return data;
}
