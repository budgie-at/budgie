import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const PillarHubHeroBulletList = ({ children }: Props) => <ul className="mt-6 space-y-2">{children}</ul>;
