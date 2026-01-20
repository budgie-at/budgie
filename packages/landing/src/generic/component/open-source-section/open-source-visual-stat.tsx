import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly value: string;
    readonly label: ReactNode;
}

export const OpenSourceVisualStat = ({ icon, value, label }: Props) => (
    <div className="text-center p-3 rounded-lg bg-gray-800/50">
        <div className="flex items-center justify-center gap-1 mb-1">
            {icon}
            <span className="font-bold">{value}</span>
        </div>

        <span className="text-xs text-gray-400">{label}</span>
    </div>
);
