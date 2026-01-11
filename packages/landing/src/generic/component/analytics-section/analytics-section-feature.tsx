import type { ReactNode } from 'react';

interface Props {
    icon: ReactNode;
    iconClassName: string;
    title: ReactNode;
    description: ReactNode;
}

export const AnalyticsSectionFeature = ({ icon, iconClassName, title, description }: Props) => (
    <div className="flex items-start gap-3">
        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconClassName}`}>{icon}</div>

        <div>
            <h3 className="font-semibold mb-1">{title}</h3>

            <p className="text-muted-foreground text-sm">{description}</p>
        </div>
    </div>
);
