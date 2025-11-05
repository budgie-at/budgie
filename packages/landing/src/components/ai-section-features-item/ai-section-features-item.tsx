import type { ReactNode } from 'react';

interface Props {
    icon: ReactNode;
    title: string;
    content: string;
}

export const AiSectionFeaturesItem = ({ icon, title, content }: Props) => (
    <div className="flex items-start gap-4">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">{icon}</div>

        <div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>

            <p className="text-muted-foreground">{content}</p>
        </div>
    </div>
);
