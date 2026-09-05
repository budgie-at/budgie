import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const FeatureStoryStep = ({ index, title, children }: Props) => (
    <div className="story-step" data-index={index} data-story-step>
        <span aria-hidden="true" className="story-step-ordinal text-xs font-semibold tracking-[0.15em] tabular-nums text-muted-foreground">
            {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="story-step-title mt-3 text-2xl lg:text-[1.75rem] lg:leading-tight font-semibold tracking-tight text-balance">
            {title}
        </h3>
        <p className="mt-3 max-w-[26rem] text-base lg:text-lg leading-relaxed text-muted-foreground text-pretty">{children}</p>
    </div>
);
