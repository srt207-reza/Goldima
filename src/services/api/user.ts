import { axiosInstance } from "@/lib/axios";
import { normalizeBusinessPathSegment } from "@/lib/business-path";
import type {
    ApiResponse,
    ApiUser,
    BusinessProfile,
    BusinessProfileSearchResponse,
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
    return Boolean(
        value &&
            typeof value === "object" &&
            "business_name" in value &&
            "business_handler" in value &&
            "telephone" in value
    );
}

function isBusinessProfileWrapper(value: unknown): value is BusinessProfile & { user: ApiUser } {
    return Boolean(isBusinessProfile(value) && "user" in value && (value as BusinessProfile).user);
}

function normalizeUserItem(item: ApiUser | BusinessProfile): ManagedUser {
    if (isBusinessProfileWrapper(item)) {
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

    const nestedBusiness =
        item && typeof item === "object" && "business" in item && isBusinessProfile((item as ApiUser).business)
            ? (item as ApiUser).business
            : null;

    if (nestedBusiness) {
        return {
            ...(item as ApiUser),
            business_profile_id: nestedBusiness.id,
            business_name: nestedBusiness.business_name,
            business_handler: nestedBusiness.business_handler,
            address: nestedBusiness.address,
            province: nestedBusiness.province ?? "",
            city: nestedBusiness.city ?? "",
            telephone: nestedBusiness.telephone,
            business_logo: nestedBusiness.business_logo,
            business_profile_created_at: nestedBusiness.created_at,
            business_profile_updated_at: nestedBusiness.updated_at,
            business_profile_is_active: nestedBusiness.is_active,
        };
    }

    if (isBusinessProfile(item)) {
        return {
            id: item.owner ?? item.id,
            last_login: null,
            first_name: "",
            last_name: "",
            email: "",
            is_active: item.is_active,
            date_joined: item.created_at,
            username: "",
            birth_date: null,
            role: "",
            status: "PENDING",
            parent: item.owner ?? null,
            business_profile_id: item.id,
            business_name: item.business_name,
            business_handler: item.business_handler,
            address: item.address,
            province: item.province ?? "",
            city: item.city ?? "",
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
        business_profile_id: user.business_profile_id,
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
    try {
        const { data } = await axiosInstance.get<UserResponse>(`/api/users/${userId}/`);
        return normalizeUserResponse(data);
    } catch (error) {
        const numericProfileId = Number(userId);

        if (!Number.isInteger(numericProfileId) || numericProfileId <= 0) {
            throw error;
        }

        const profile = await getBusinessProfile(numericProfileId);
        return normalizeUserItem(profile);
    }
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

export async function searchBusinessProfiles(q: string): Promise<BusinessProfile[]> {
    const query = q.trim();

    if (!query) {
        return [];
    }

    const { data } = await axiosInstance.get<BusinessProfileSearchResponse>(
        "/api/business-profile/",
        { params: { q: query } }
    );

    return Array.isArray(data.data) ? data.data : [];
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
    const sanitizedPayload: BusinessProfileUpdatePayload = {
        ...payload,
    };

    if (typeof sanitizedPayload.business_logo === "string") {
        delete sanitizedPayload.business_logo;
    }

    const requestPayload = hasFileValue(sanitizedPayload) ? buildBusinessProfileFormData(sanitizedPayload) : sanitizedPayload;
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
