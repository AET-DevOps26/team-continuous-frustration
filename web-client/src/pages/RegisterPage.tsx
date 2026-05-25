import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";

export function RegisterPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Create account"
                subtitle="Register to save your decks and learning progress."
            />

            <Card>
                <p>Register form will be implemented here.</p>
            </Card>
        </PageContainer>
    );
}