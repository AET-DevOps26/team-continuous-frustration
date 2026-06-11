import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function OAuthCallbackPage() {
    const navigate = useNavigate();
    const { refetch } = useAuth();

    useEffect(() => {
        refetch().then(() => navigate("/", { replace: true }));
    }, []);

    return null;
}
