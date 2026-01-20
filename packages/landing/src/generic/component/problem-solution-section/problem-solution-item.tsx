import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly text: ReactNode;
    readonly variant: 'problem' | 'solution';
}

export const ProblemSolutionItem = ({ icon, text, variant }: Props) => {
    const isProblem = variant === 'problem';

    const textClassName = isProblem ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400';

    const iconClassName = isProblem
        ? 'size-6 rounded-full bg-red-200 dark:bg-red-900/50 flex items-center justify-center shrink-0'
        : 'size-6 rounded-full bg-green-200 dark:bg-green-900/50 flex items-center justify-center shrink-0';

    return (
        <li className={`flex items-center gap-3 ${textClassName}`}>
            <div className={iconClassName}>{icon}</div>

            <span>{text}</span>
        </li>
    );
};
