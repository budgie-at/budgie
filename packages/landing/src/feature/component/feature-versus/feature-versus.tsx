import { FeatureLayoutSection } from '../feature-layout-section/feature-layout-section';
import { FeatureVersusItem } from '../feature-versus-item/feature-versus-item';
import { FeatureVersusWith } from '../feature-versus-with/feature-versus-with';
import { FeatureVersusWithout } from '../feature-versus-without/feature-versus-without';

import type { ReactNode } from 'react';

interface Props {
    readonly heading: ReactNode;
    readonly lede: ReactNode;
    readonly children: ReactNode;
}

const FeatureVersusRoot = ({ heading, lede, children }: Props) => (
    <FeatureLayoutSection heading={heading} lede={<p className="feature-section-lede">{lede}</p>}>
        <div className="feature-versus">{children}</div>
    </FeatureLayoutSection>
);

export const FeatureVersus = Object.assign(FeatureVersusRoot, {
    Without: FeatureVersusWithout,
    With: FeatureVersusWith,
    Item: FeatureVersusItem
});
