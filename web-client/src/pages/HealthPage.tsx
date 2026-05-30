import { useEffect, useState } from "react";
import axios from "axios";

import "../styles/HealthPage.css";

type HealthResponse = {
    status: string;
};

export function HealthPage() {
    const [status, setStatus] = useState<string>("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        const controller = new AbortController();

        axios
            .get<HealthResponse>("/api/v1/flashcards/health", {
                signal: controller.signal,
            })
            .then((res) => {
                const data = res.data;
                if (isActive) {
                    setStatus(data.status ?? "unknown");
                }
            })
            .catch((err: Error) => {
                if (isActive) {
                    setError(err.message);
                }
            });

        return () => {
            isActive = false;
            controller.abort();
        };
    }, []);

    return (
        <main className="health-page">
            <div className="health-card">
                <h1>Service Health</h1>
                {error ? (
                    <p className="health-error">ERROR: {error}</p>
                ) : (
                    <p className="health-status">Status: {status}</p>
                )}
                <p className="health-endpoint">/api/v1/flashcards/health</p>
            </div>
        </main>
    );
}
