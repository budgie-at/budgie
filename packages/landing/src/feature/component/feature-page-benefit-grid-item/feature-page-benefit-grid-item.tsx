import { CheckCircle2 } from 'lucide-react';

import { Motion } from '../../../generic/component/motion/motion';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly index?: number;
}

export const FeaturePageBenefitGridItem = ({ children, index = 0 }: Props) => (
    <Motion index={index}>
        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-4 md:p-5">
            <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <p className="text-sm md:text-base">{children}</p>
        </div>
    </Motion>
);
