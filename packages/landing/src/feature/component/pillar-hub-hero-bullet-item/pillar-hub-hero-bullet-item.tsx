import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const PillarHubHeroBulletItem = ({ children }: Props) => (
    <li className="flex items-start gap-2 text-muted-foreground">
        <span aria-hidden className="mt-1 text-emerald-500">
            ✓
        </span>
        <span>{children}</span>
    </li>
);
