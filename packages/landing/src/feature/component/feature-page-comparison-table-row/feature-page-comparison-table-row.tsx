import type { ReactNode } from 'react';

interface Props {
    readonly concern: ReactNode;
    readonly rival: ReactNode;
    readonly budgie: ReactNode;
}

export const FeaturePageComparisonTableRow = ({ concern, rival, budgie }: Props) => (
    <tr>
        <td className="p-3 font-medium">{concern}</td>
        <td className="p-3">{rival}</td>
        <td className="p-3">{budgie}</td>
    </tr>
);
