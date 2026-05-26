import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UploadPage } from "./pages/UploadPage";
import { CardStudioPage } from "./pages/CardStudioPage";
import { DecksPage } from "./pages/DecksPage";
import { DeckDetailPage } from "./pages/DeckDetailPage";
import { StudySessionPage } from "./pages/StudySessionPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<HomePage />} />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/cards" element={<CardStudioPage />} />

                    <Route path="/decks" element={<DecksPage />} />
                    <Route path="/decks/:deckId" element={<DeckDetailPage />} />

                    <Route path="/study" element={<StudySessionPage />} />
                    <Route path="/study/:deckId" element={<StudySessionPage />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
