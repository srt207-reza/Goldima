import { axiosInstance } from "@/lib/axios";
import { normalizeBusinessPathSegment } from "@/lib/business-path";
import type {
    ApiResponse,
    ApiUser,
    BusinessProfile,
    BusinessProfileUpdatePayload,
    CurrentUser,
    CurrentUserResponse,
    ManagedUser,
    ParentBusinessProfileResponse,
    PublicBusinessProfile,
    UserResponse,
    UsersQueryParams,
    UsersResponse,
} from "@/types/api/user";

export async function getUsers(params?: UsersQueryParams): Promise<UsersResponse> {
    const { data } = await axiosInstance.get<UsersResponse>("/api/users/", { params });
    return data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
    const { data } = await axiosInstance.get<CurrentUserResponse>("/api/users/me/");
    return data;
}

function hasData<T>(value: unknown): value is ApiResponse<T> {
    return Boolean(value && typeof value === "object" && "data" in value);
}

function isBusinessProfile(value: unknown): value is BusinessProfile {
    return Boolean(value && typeof value === "object" && "user" in value);
}

function normalizeUserItem(item: ApiUser | BusinessProfile): ManagedUser {
    if (isBusinessProfile(item)) {
        return {
            ...item.user,
            business_profile_id: item.id,
            business_name: item.business_name,
            business_handler: item.business_handler,
            address: item.address,
            province: item.province,
            city: item.city,
            telephone: item.telephone,
            business_logo: item.business_logo,
            business_profile_created_at: item.created_at,
            business_profile_updated_at: item.updated_at,
            business_profile_is_active: item.is_active,
        };
    }

    return {
        ...item,
        business_profile_id:
            typeof item.business_profile_id === "number" ? item.business_profile_id : null,
        business_name: item.business_name ?? "",
        business_handler: item.business_handler ?? null,
        address: item.address ?? "",
        province: item.province ?? "",
        city: item.city ?? "",
        telephone: item.telephone ?? "",
        business_logo: item.business_logo ?? null,
    };
}

export function normalizeCurrentUserResponse(response: CurrentUserResponse): CurrentUser {
    const user = normalizeUserItem(response.data);

    return {
        ...user,
        business_profile_id: response.data.id,
    };
}

export function normalizeUsersResponse(response: UsersResponse): ManagedUser[] {
    const payload = hasData<ApiUser[] | BusinessProfile[]>(response) ? response.data : response;
    const list =
        Array.isArray(payload)
            ? payload
            : payload && typeof payload === "object" && "results" in payload && Array.isArray(payload.results)
              ? payload.results
              : [];

    return list.map(normalizeUserItem);
}

function normalizeUserResponse(response: UserResponse): ManagedUser {
    const payload = hasData<ApiUser | BusinessProfile>(response) ? response.data : response;
    return normalizeUserItem(payload);
}

/**
 * Retrieve a single user by their identifier.
 *
 * @param userId Primary key or UUID of the user to fetch.
 */
export async function getUserById(userId: string | number): Promise<ManagedUser> {
    const { data } = await axiosInstance.get<UserResponse>(`/api/users/${userId}/`);
    return normalizeUserResponse(data);
}

/**
 * Update a user record.
 *
 * @param userId Identifier of the user to update.
 * @param payload Partial set of fields to update on the user.
 */
export async function updateUser(
    userId: string | number,
    payload: Partial<ApiUser>
): Promise<ApiUser> {
    const { data } = await axiosInstance.put<ApiResponse<ApiUser> | ApiUser>(
        `/api/users/${userId}/`,
        payload
    );

    if ("data" in data) {
        return data.data;
    }

    return data;
}

/**
 * Retrieve a business profile by its identifier.
 *
 * @param profileId Identifier of the profile to fetch.
 */
export async function getBusinessProfile(profileId: number): Promise<BusinessProfile> {
    const { data } = await axiosInstance.get<ApiResponse<BusinessProfile> | BusinessProfile>(
        `/api/users/profile/${profileId}/`
    );

    if ("data" in data) {
        return data.data;
    }

    return data;
}

export async function getParentBusinessProfile(
    businessHandler: string
): Promise<PublicBusinessProfile> {
    const normalizedHandler = normalizeBusinessPathSegment(businessHandler);
    const { data } = await axiosInstance.get<ParentBusinessProfileResponse>(
        `/api/users/parent_profile/${encodeURIComponent(normalizedHandler)}/`
    );

    return data.data;
}

function hasFileValue(payload: BusinessProfileUpdatePayload): boolean {
    return Object.values(payload).some((value) => typeof File !== "undefined" && value instanceof File);
}

function buildBusinessProfileFormData(payload: BusinessProfileUpdatePayload): FormData {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value === null || typeof value === "undefined") return;

        if (typeof File !== "undefined" && value instanceof File) {
            formData.append(key, value);
            return;
        }

        formData.append(key, String(value));
    });

    return formData;
}

/**
 * Update a business profile record.
 *
 * @param profileId Identifier of the profile to update.
 * @param payload Partial set of fields to update on the profile.
 */
export async function updateBusinessProfile(
    profileId: number,
    payload: BusinessProfileUpdatePayload
): Promise<BusinessProfile> {
    const requestPayload = hasFileValue(payload) ? buildBusinessProfileFormData(payload) : payload;
    const headers = requestPayload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined;

    const { data } = await axiosInstance.put<ApiResponse<BusinessProfile> | BusinessProfile>(
        `/api/users/profile/${profileId}/`,
        requestPayload,
        { headers }
    );

    if ("data" in data) {
        return data.data;
    }

    return data;
}
