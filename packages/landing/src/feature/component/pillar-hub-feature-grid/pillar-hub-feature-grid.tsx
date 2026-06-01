import { PillarHubFeatureGridItem } from '../pillar-hub-feature-grid-item/pillar-hub-feature-grid-item';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const PillarHubFeatureGridRoot = ({ children }: Props) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
);

export const PillarHubFeatureGrid = Object.assign(PillarHubFeatureGridRoot, {
    Item: PillarHubFeatureGridItem
});
