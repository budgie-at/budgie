import { ComparisonCheck } from './comparison-check';
import { ComparisonX } from './comparison-x';

import type { ReactNode } from 'react';

interface Props {
    readonly feature: ReactNode;
    readonly budgie: boolean;
    readonly others: boolean;
}

export const ComparisonRow = ({ feature, budgie, others }: Props) => (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
        <td className="p-4 font-medium">{feature}</td>

        <td className="p-4 text-center">{budgie ? <ComparisonCheck /> : <ComparisonX />}</td>

        <td className="p-4 text-center">{others ? <ComparisonCheck /> : <ComparisonX />}</td>
    </tr>
);
