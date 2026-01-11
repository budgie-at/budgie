import { Motion } from '../motion/motion';

import type { ReactNode } from 'react';

interface Props {
    icon: ReactNode;
    label: ReactNode;
}

const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 }
};

export const IntegrationsSectionFeature = ({ icon, label }: Props) => (
    <Motion variants={itemVariants}>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
            {icon}

            <span className="font-medium">{label}</span>
        </div>
    </Motion>
);
