import type { ReactNode } from 'react';

interface Props {
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
}

export const OpenSourceFeature = ({ icon, title, description }: Props) => (
    <div className="flex items-start gap-4">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>

        <div>
            <h4 className="font-semibold mb-1">{title}</h4>

            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </div>
);
