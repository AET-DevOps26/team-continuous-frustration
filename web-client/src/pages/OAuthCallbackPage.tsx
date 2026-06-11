import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function OAuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("auth_token", token);
        }
        navigate("/", { replace: true });
    }, []);

    return null;
}
