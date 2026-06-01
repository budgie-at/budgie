import { Trans } from '@lingui/react/macro';

import { FeaturePageCategoryComparisonRow } from '../feature-page-category-comparison-row/feature-page-category-comparison-row';

import type { ReactNode } from 'react';

interface Props {
    readonly categoryLabel: ReactNode;
    readonly children: ReactNode;
}

const FeaturePageCategoryComparisonRoot = ({ categoryLabel, children }: Props) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border/60 rounded-lg">
            <thead className="bg-muted/40">
                <tr>
                    <th className="text-left p-3">
                        <Trans>Feature</Trans>
                    </th>
                    <th className="text-left p-3">
                        <Trans>Budgie</Trans>
                    </th>
                    <th className="text-left p-3">{categoryLabel}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border/40">{children}</tbody>
        </table>
    </div>
);

export const FeaturePageCategoryComparison = Object.assign(FeaturePageCategoryComparisonRoot, {
    Row: FeaturePageCategoryComparisonRow
});
