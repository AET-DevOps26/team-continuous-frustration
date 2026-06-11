import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UploadPage } from "./pages/UploadPage";
import { CardStudioPage } from "./pages/CardStudioPage";
import { DecksPage } from "./pages/DecksPage";
import { DeckDetailPage } from "./pages/DeckDetailPage";
import { StudySessionPage } from "./pages/StudySessionPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

                        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
                        <Route path="/cards" element={<ProtectedRoute><CardStudioPage /></ProtectedRoute>} />
                        <Route path="/decks" element={<ProtectedRoute><DecksPage /></ProtectedRoute>} />
                        <Route path="/decks/:deckId" element={<ProtectedRoute><DeckDetailPage /></ProtectedRoute>} />
                        <Route path="/study" element={<ProtectedRoute><StudySessionPage /></ProtectedRoute>} />
                        <Route path="/study/:deckId" element={<ProtectedRoute><StudySessionPage /></ProtectedRoute>} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
