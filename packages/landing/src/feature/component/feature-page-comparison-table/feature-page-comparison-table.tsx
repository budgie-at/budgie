import { Trans } from '@lingui/react/macro';

import type { ReactNode } from 'react';

export interface ComparisonRowInterface {
    readonly concern: ReactNode;
    readonly rival: ReactNode;
    readonly budgie: ReactNode;
}

interface Props {
    readonly rivalLabel: ReactNode;
    readonly rows: readonly ComparisonRowInterface[];
}

export const FeaturePageComparisonTable = ({ rivalLabel, rows }: Props) => (
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
            <tbody className="divide-y divide-border/40">
                {rows.map((row, index) => (
                    <tr key={`row-${index}`}>
                        <td className="p-3 font-medium">{row.concern}</td>
                        <td className="p-3">{row.rival}</td>
                        <td className="p-3">{row.budgie}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
