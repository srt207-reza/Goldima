export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ApiUser = {
    id?: number | string;
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    birth_date?: string;
    business_name?: string;
    address?: string;
    telephone?: string;
    status?: UserStatus;
    is_active?: boolean;
    role?: string;
    user_role?: string;
    account_type?: string;
    business_role?: string;
    type?: string;
    [key: string]: unknown;
};

export type UsersQueryParams = {
    status?: UserStatus;
};

export type UsersResponse = ApiUser[] | { results: ApiUser[] } | unknown;
export type CurrentUserResponse = ApiUser;
