import { InstallmentPreviewPlan } from '../installment-preview-plan/installment-preview-plan';
import { InstallmentPreviewPurchase } from '../installment-preview-purchase/installment-preview-purchase';
import { InstallmentPreviewSheet } from '../installment-preview-sheet/installment-preview-sheet';

import type { ReactNode } from 'react';

interface Props {
    readonly caption: ReactNode;
    readonly children: ReactNode;
}

const InstallmentPreviewRoot = ({ caption, children }: Props) => (
    <figure className="ipv">
        <figcaption className="sr-only">{caption}</figcaption>
        <div aria-hidden="true" className="ipv-scene">
            <span className="ipv-glow" />
            <span className="ipv-grid" />
            {children}
        </div>
    </figure>
);

export const InstallmentPreview = Object.assign(InstallmentPreviewRoot, {
    Plan: InstallmentPreviewPlan,
    Purchase: InstallmentPreviewPurchase,
    Sheet: InstallmentPreviewSheet
});
