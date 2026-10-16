import { Trans } from '@lingui/react/macro';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FeatureBenefitsIncluded = ({ children }: Props) => (
    <div className="feature-included">
        <h3 className="feature-included-title">
            <Trans>Everything included</Trans>
        </h3>
        <ul className="feature-included-list">{children}</ul>
    </div>
);
