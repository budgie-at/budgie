import { FeatureLayoutSection } from '../feature-layout-section/feature-layout-section';
import { FeatureSpecTile } from '../feature-spec-tile/feature-spec-tile';

import type { ReactNode } from 'react';

interface Props {
    readonly heading: ReactNode;
    readonly children: ReactNode;
}

const FeatureSpecTilesRoot = ({ heading, children }: Props) => (
    <FeatureLayoutSection heading={heading}>
        <div className="feature-tiles">{children}</div>
    </FeatureLayoutSection>
);

export const FeatureSpecTiles = Object.assign(FeatureSpecTilesRoot, {
    Tile: FeatureSpecTile
});
