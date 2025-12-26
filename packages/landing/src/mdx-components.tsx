/* eslint-disable id-length, react/no-multi-comp */
import type { MDXComponents } from 'mdx/types';

const ownComponents: MDXComponents = {
    h1: props => <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" {...props} />,
    h2: props => <h2 className="text-2xl font-bold mb-4" {...props} />,
    h3: props => <h3 className="text-lg font-semibold mb-3" {...props} />,
    h4: props => <h4 className="font-semibold mb-2" {...props} />,
    p: props => <p className="mb-4" {...props} />,
    ul: props => <ul className="list-disc pl-6 space-y-2" {...props} />,
    li: props => <li className="text-base mb-2 ml-6" {...props} />,
    ol: props => <ol className="text-base mb-2 ml-6" {...props} />,
    a: props => <a className="text-primary hover:underline" {...props} />,
    strong: props => <strong className="font-semibold" {...props} />,
    em: props => <em className="italic" {...props} />,
    hr: props => <hr className="my-6" {...props} />,
    img: props => <img className="rounded-lg" {...props} />,
    blockquote: ({ children, ...props }) => (
        <blockquote className="mt-2 mb-2 p-3 bg-muted/50 rounded border border-border" {...props}>
            <p className="text-sm italic">{children}</p>
        </blockquote>
    ),
    Muted: props => <div className="text-muted-foreground mb-8" {...props} />,
    Highlighted: props => <div className="mt-4 p-4 bg-muted rounded-lg mb-8" {...props} />
} satisfies MDXComponents;

// eslint-disable-next-line func-style
export function useMDXComponents(components: MDXComponents): MDXComponents {
    return { ...components, ...ownComponents };
}
