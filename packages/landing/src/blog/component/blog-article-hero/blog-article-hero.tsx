import Image from 'next/image';

import { isDefined } from '@rnw-community/shared';

import { Motion } from '../../../generic/component/motion/motion';

import type { ReactNode } from 'react';

interface Props {
    image?: string;
    imageAlt: string;
    children: ReactNode;
}

export const BlogArticleHero = ({ image, imageAlt, children }: Props) => (
    <article className="w-full py-20 md:py-32">
        <div className="container px-4 md:px-6 max-w-4xl">
            <Motion>{children}</Motion>

            {isDefined(image) && (
                <div className="relative h-[400px] overflow-hidden rounded-xl mt-8">
                    <Image alt={imageAlt} className="object-cover" fill priority src={image} />
                </div>
            )}
        </div>
    </article>
);
