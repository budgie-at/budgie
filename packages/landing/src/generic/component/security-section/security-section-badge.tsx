import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly label: string;
}

export const SecuritySectionBadge = ({ icon, label }: Props) => (
    <div className="flex items-center gap-2 bg-background/80 rounded-xl p-3">
        {icon}

        <span className="text-sm font-medium">{label}</span>
    </div>
);
