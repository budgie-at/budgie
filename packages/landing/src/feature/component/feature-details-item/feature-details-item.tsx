import { FeatureDrawerRow } from '../feature-drawer-row/feature-drawer-row';

import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const FeatureDetailsItem = ({ index, title, children }: Props) => (
    <FeatureDrawerRow index={index} marker={String(index + 1).padStart(2, '0')} summary={title}>
        {children}
    </FeatureDrawerRow>
);
