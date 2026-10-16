import { HelpCircle } from 'reicon-react';

import { FeatureDrawerRow } from '../feature-drawer-row/feature-drawer-row';

import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly question: ReactNode;
    readonly answer: ReactNode;
}

export const FeatureFaqItem = ({ index, question, answer }: Props) => (
    <FeatureDrawerRow index={index} marker={<HelpCircle className="size-4" />} summary={question}>
        <p>{answer}</p>
    </FeatureDrawerRow>
);
