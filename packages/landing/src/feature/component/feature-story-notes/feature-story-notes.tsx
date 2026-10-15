import type { FeatureStoryCallout } from '../feature-story-callout/feature-story-callout';
import type { ComponentProps, ReactElement } from 'react';

interface Props {
    readonly index: number;
    readonly callouts: readonly ReactElement<ComponentProps<typeof FeatureStoryCallout>>[];
}

export const FeatureStoryNotes = ({ index, callouts }: Props) => (
    <ol className="story-notes-list" data-index={index} data-story-stage>
        {callouts.map(callout => (
            <li className="story-note" data-index={callout.props.index} data-story-callout key={callout.key}>
                {callout.props.children}
            </li>
        ))}
    </ol>
);
