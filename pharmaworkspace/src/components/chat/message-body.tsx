'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MessageBodyProps = {
  body: string
  className?: string
}

export function MessageBody({ body, className }: MessageBodyProps) {
  return (
    <div className={className}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
          >
            {children}
          </a>
        ),
        p: ({ children }) => <p className="whitespace-pre-wrap break-words">{children}</p>,
        code: ({ children }) => (
          <code className="rounded bg-black/10 px-1 py-0.5 text-[0.9em]">{children}</code>
        ),
      }}
    >
      {body}
    </ReactMarkdown>
    </div>
  )
}
