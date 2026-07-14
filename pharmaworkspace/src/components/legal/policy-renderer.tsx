import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  h1: () => null,
  h2: ({ children }) => (
    <h2 className="mt-12 mb-4 text-2xl font-semibold tracking-tight text-slate-900 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-3 text-xl font-semibold text-slate-900">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-6 mb-2 text-base font-semibold text-slate-900">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="my-3 text-sm leading-relaxed text-slate-700">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 ml-5 list-disc space-y-1.5 text-sm leading-relaxed text-slate-700 marker:text-slate-400">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 ml-5 list-decimal space-y-1.5 text-sm leading-relaxed text-slate-700 marker:text-slate-400">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-teal-700 underline-offset-4 hover:underline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
      {children}
    </code>
  ),
  hr: () => <hr className="my-10 border-t border-slate-200" />,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-slate-200 pl-4 italic text-slate-600">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left align-top font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 align-top text-slate-700">{children}</td>
  ),
}

export function PolicyRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}
