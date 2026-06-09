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
