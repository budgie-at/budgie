import type { ReactNode } from 'react';

interface Props {
    readonly label: ReactNode;
    readonly budgieValue: ReactNode;
    readonly competitorValue: ReactNode;
}

export const FeaturePageCategoryComparisonRow = ({ label, budgieValue, competitorValue }: Props) => (
    <tr>
        <td className="p-3 font-medium">{label}</td>
        <td className="p-3">{budgieValue}</td>
        <td className="p-3">{competitorValue}</td>
    </tr>
);
