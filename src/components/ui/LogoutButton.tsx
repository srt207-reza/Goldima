"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "./button";
import { useLogoutMutation } from "@/hooks/api";
import { clearAuthTokens, getRefreshToken } from "@/lib/auth-storage";

export default function LogoutButton() {
    const router = useRouter();
    const logoutMutation = useLogoutMutation();

    const handleLogout = async () => {
        const refresh = getRefreshToken();

        try {
            if (refresh) {
                await logoutMutation.mutateAsync({ refresh });
            }

            clearAuthTokens();
            toast.success("با موفقیت خارج شدید");
            router.replace("/login");
        } catch (error) {
            clearAuthTokens();
            const message = error instanceof Error ? error.message : "خروج با خطا مواجه شد";
            toast.error(message);
            router.replace("/login");
        }
    };

    return (
        <Button variant="ghost" onClick={handleLogout} disabled={logoutMutation.isPending}>
            خروج
        </Button>
    );
}
