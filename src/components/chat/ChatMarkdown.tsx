import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export default function ChatMarkdown({ content }: Props) {
  return (
    <div className="min-w-0 max-w-full text-sm leading-relaxed [overflow-wrap:anywhere] break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="my-1.5 first:mt-0 last:mb-0 break-words [overflow-wrap:anywhere]">
              {children}
            </p>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-1.5 pl-5 list-disc space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1.5 pl-5 list-decimal space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="break-words [overflow-wrap:anywhere]">{children}</li>
          ),
          h1: ({ children }) => <h1 className="mt-2 mb-1 text-base font-bold first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-2 mb-1 text-sm font-bold first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-2 mb-1 text-sm font-semibold first:mt-0">{children}</h3>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 [overflow-wrap:anywhere]"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-1.5 border-l-2 border-border pl-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-2 border-border" />,
          code: ({ className, children }) => {
            const isBlock = (className ?? "").includes("language-");
            if (!isBlock) {
              return (
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] [overflow-wrap:anywhere]">
                  {children}
                </code>
              );
            }
            return <code className="font-mono text-[0.85em]">{children}</code>;
          },
          pre: ({ children }) => (
            <pre className="my-1.5 overflow-x-auto rounded-lg border border-border bg-muted/60 p-2.5 text-[0.85em] leading-relaxed">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-1.5 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2 py-1 align-top">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
