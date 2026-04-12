import { Motion } from '../../../generic/component/motion/motion';

import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const BlogArticleContent = ({ children }: Props) => (
    <div className="container px-4 md:px-6 max-w-4xl">
        <Motion>
            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">{children}</div>
        </Motion>
    </div>
);
