import { Trans } from '@lingui/react/macro';

import { FeaturePageComparisonTableRow } from '../feature-page-comparison-table-row/feature-page-comparison-table-row';

import type { ReactNode } from 'react';

interface Props {
    readonly rivalLabel: ReactNode;
    readonly children: ReactNode;
}

const FeaturePageComparisonTableRoot = ({ rivalLabel, children }: Props) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border/60 rounded-lg">
            <thead className="bg-muted/40">
                <tr>
                    <th className="text-left p-3">
                        <Trans>Concern</Trans>
                    </th>
                    <th className="text-left p-3">{rivalLabel}</th>
                    <th className="text-left p-3">
                        <Trans>Budgie</Trans>
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border/40">{children}</tbody>
        </table>
    </div>
);

export const FeaturePageComparisonTable = Object.assign(FeaturePageComparisonTableRoot, {
    Row: FeaturePageComparisonTableRow
});
