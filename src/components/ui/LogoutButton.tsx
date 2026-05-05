    "use client";

    import { useRouter } from "next/navigation";
    import Cookies from "js-cookie";
    import toast from "react-hot-toast";
import { Button } from "./button";

    export default function LogoutButton() {
      const router = useRouter();

      const handleLogout = () => {
        Cookies.remove("auth_token");
        toast.success("با موفقیت خارج شدید");
        router.push("/login");
        router.refresh();
      };

      return (
        <Button variant="ghost" onClick={handleLogout}>
          خروج
        </Button>
      );
    }
