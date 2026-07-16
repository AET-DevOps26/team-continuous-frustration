import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

import { cn } from "@/lib/utils";

const components: Components = {
  p: ({ node: _node, ...props }) => <span {...props} />,
  a: ({ node: _node, className, ...props }) => (
    <a className={cn("underline underline-offset-2", className)} target="_blank" rel="noreferrer" {...props} />
  ),
  code: ({ node: _node, className, ...props }) => (
    <code className={cn("rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]", className)} {...props} />
  ),
  ul: ({ node: _node, className, ...props }) => <ul className={cn("ml-4 list-disc", className)} {...props} />,
  ol: ({ node: _node, className, ...props }) => <ol className={cn("ml-4 list-decimal", className)} {...props} />,
};

export function Markdown({
  children,
  className,
  as: As = "div",
}: {
  children: string;
  className?: string;
  as?: "div" | "span";
}) {
  return (
    <As className={cn(className)}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </As>
  );
}
