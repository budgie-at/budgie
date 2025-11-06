import type { MDXComponents } from 'mdx/types';

const ownComponents: MDXComponents = {
    h1: ({ children }) => <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 mt-12">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 mt-10">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 mt-8">{children}</h3>,
    p: ({ children }) => <p className="text-lg font-bold mb-2 mt-4">{children}</p>,
    li: ({ children }) => <li className="text-base mb-2 ml-6">{children}</li>,
    a: ({ children, ...props }) => (
        <a className="text-primary hover:underline" {...props}>
            {children}
        </a>
    )
} satisfies MDXComponents;

// eslint-disable-next-line func-style
export function useMDXComponents(components: MDXComponents): MDXComponents {
    return { ...components, ...ownComponents };
}
