export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

export type UserRole = "MASTER" | "WHOLESALER" | "RETAIL" | "BUSINESS_HANDLER" | string;

export type ApiUser = {
    id: string | number;
    last_login: string | null;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    date_joined: string;
    username: string;
    birth_date: string | null;
    role: UserRole;
    status: UserStatus;
    parent: string | null;
    business_name?: string;
    business_handler?: string | null;
    business_profile_id?: number | null;
    address?: string;
    telephone?: string;
    business_logo?: string | null;
    user_role?: string;
    account_type?: string;
    business_role?: string;
    type?: string;
};

export type BusinessProfile = {
    id: number;
    user: ApiUser;
    business_name: string;
    business_handler: string | null;
    address: string;
    telephone: string;
    business_logo: string | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
};

export type UsersQueryParams = {
    status?: UserStatus;
};

export type ApiResponse<T> = {
    data: T;
};

export type UsersResponse =
    | ApiUser[]
    | BusinessProfile[]
    | {
          results: ApiUser[] | BusinessProfile[];
      }
    | ApiResponse<ApiUser[]>
    | ApiResponse<BusinessProfile[]>;

export type UserResponse = ApiResponse<ApiUser | BusinessProfile> | ApiUser | BusinessProfile;

export type CurrentUserResponse = ApiResponse<BusinessProfile>;

export type ManagedUser = ApiUser & {
    business_profile_id: number | null;
    business_name: string;
    business_handler: string | null;
    address: string;
    telephone: string;
    business_logo: string | null;
    business_profile_created_at?: string;
    business_profile_updated_at?: string;
    business_profile_is_active?: boolean;
};

export type CurrentUser = ManagedUser & {
    business_profile_id: number;
};
