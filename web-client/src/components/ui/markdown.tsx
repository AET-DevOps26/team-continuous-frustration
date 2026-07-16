import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

import { cn } from "@/lib/utils";

const components: Components = {
  p: ({ node: _node, ...props }) => <span {...props} />,
  a: ({ node: _node, ...props }) => (
    <a className="underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />
  ),
  code: ({ node: _node, ...props }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]" {...props} />
  ),
  ul: ({ node: _node, ...props }) => <ul className="ml-4 list-disc" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="ml-4 list-decimal" {...props} />,
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
