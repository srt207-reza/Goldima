import axios from "axios";
import Swal from "sweetalert2";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

let isAuthAlertShown = false;

// مدیریت اضافه کردن توکن به درخواست‌ها
axiosInstance.interceptors.request.use(
    (config) => {
        // دریافت مستقیم توکن شبیه‌سازی‌شده از کوکی
        const token = Cookies.get("auth_token");

        if (token) {
            config.headers["x-access-tokens"] = token;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// مدیریت خطاهای دریافتی از سرور
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (!isAuthAlertShown && typeof window !== "undefined" && !window.location.href.includes("login")) {
                isAuthAlertShown = true;

                Swal.fire({
                    title: "نیاز به ورود",
                    text: "برای دسترسی به این بخش لطفا وارد حساب کاربری خود شوید.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "ورود / ثبت‌نام",
                    cancelButtonText: "انصراف",
                    confirmButtonColor: "#3b82f6",
                    cancelButtonColor: "#ef4444",
                    reverseButtons: true,
                    customClass: {
                        popup: "font-sans rounded-2xl",
                    }
                }).then((result) => {
                    isAuthAlertShown = false;
                    if (result.isConfirmed) {
                        window.location.href = "/login";
                    }
                });
            }
        }

        if (error.response && error.response.data) {
            const backendData = error.response.data;
            const backendMessage = backendData.message || backendData.detail || backendData.error || backendData.msg;

            if (backendMessage) {
                error.message = backendMessage;
            } else if (typeof backendData === "string") {
                error.message = backendData;
            }
        }

        return Promise.reject(error);
    }
);
