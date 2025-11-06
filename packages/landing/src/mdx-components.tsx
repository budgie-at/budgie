import type { MDXComponents } from 'mdx/types';

const ownComponents: MDXComponents = {
    h1: props => <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 mt-12" {...props} />,
    h2: props => <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 mt-10" {...props} />,
    h3: props => <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 mt-8" {...props} />,
    p: props => <p className="text-lg font-bold mb-2 mt-4" {...props} />,
    li: props => <li className="text-base mb-2 ml-6" {...props} />,
    ol: props => <ol className="text-base mb-2 ml-6" {...props} />,
    a: props => <a className="text-primary hover:underline" {...props} />,
    strong: props => <strong className="font-semibold" {...props} />,
    em: props => <em className="italic" {...props} />,
    blockquote: props => <blockquote className="border-l-4 border-primary pl-4 italic" {...props} />,
    hr: props => <hr className="my-6" {...props} />,
    img: props => <img className="rounded-lg" {...props} />
} satisfies MDXComponents;

// eslint-disable-next-line func-style
export function useMDXComponents(components: MDXComponents): MDXComponents {
    return { ...components, ...ownComponents };
}
