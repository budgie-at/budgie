import type { ReactNode } from 'react';

interface Props {
    readonly name: ReactNode;
}

export const BanksSectionItem = ({ name }: Props) => (
    <div className="h-8 px-4 flex items-center justify-center bg-muted rounded text-sm font-medium text-muted-foreground">{name}</div>
);
