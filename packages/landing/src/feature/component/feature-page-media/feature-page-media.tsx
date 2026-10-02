import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FeaturePageMedia = ({ children }: Props) => (
    <section className="w-full py-8 md:py-10">
        <figure className="mx-auto w-full max-w-[17rem] px-4 md:max-w-[19rem]">{children}</figure>
    </section>
);
