import { Link } from "react-router-dom";
import { Upload, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const features = [
  {
    id: "upload",
    icon: Upload,
    title: "Upload Slides",
    description: "Upload PDFs or lecture slides and generate AI flashcards instantly.",
    path: "/upload",
    cta: "Upload now",
  },
  {
    id: "decks",
    icon: BookOpen,
    title: "My Decks",
    description: "Organize, edit, and manage your generated flashcard decks.",
    path: "/decks",
    cta: "View decks",
  },
  {
    id: "study",
    icon: GraduationCap,
    title: "Start Review",
    description: "Review due flashcards with active recall and spaced repetition.",
    path: "/study",
    cta: "Study now",
  },
];

export function HomePage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          {user?.username ? `Welcome back, ${user.username}.` : "Welcome back."}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pick up where you left off or start something new.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {features.map(({ id, icon: Icon, title, description, path, cta }) => (
          <div
            key={id}
            className="card-shadow flex flex-col rounded-3xl border border-border bg-card p-6"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{description}</p>
            <Button asChild className="mt-6" variant="outline" size="sm">
              <Link to={path}>{cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
