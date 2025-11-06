import type { ReactNode } from 'react';

interface Props {
    icon: ReactNode;
    title: string;
    description: string;
}

export const WhitelistSectionOfferBenefit = ({ icon, title, description }: Props) => (
    <div className="text-center space-y-3">
        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">{icon}</div>

        <h3 className="font-semibold">{title}</h3>

        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);
