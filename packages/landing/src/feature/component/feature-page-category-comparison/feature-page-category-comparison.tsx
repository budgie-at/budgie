import { Trans } from '@lingui/react/macro';

import type { ReactNode } from 'react';

interface RowInterface {
    readonly label: ReactNode;
    readonly budgieValue: ReactNode;
    readonly competitorValue: ReactNode;
}

interface Props {
    readonly categoryLabel: ReactNode;
    readonly rows: readonly RowInterface[];
}

export const FeaturePageCategoryComparison = ({ categoryLabel, rows }: Props) => (
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
            <tbody className="divide-y divide-border/40">
                {rows.map((row, index) => (
                    <tr key={`row-${index}`}>
                        <td className="p-3 font-medium">{row.label}</td>
                        <td className="p-3">{row.budgieValue}</td>
                        <td className="p-3">{row.competitorValue}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
