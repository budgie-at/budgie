import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { Motion } from '../motion/motion';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly iconClassName: string;
    readonly cardClassName: string;
    readonly title: ReactNode;
    readonly description: ReactNode;
    readonly badges: ReactNode;
    readonly delay?: number;
}

const viewportOnce = { once: true };

export const IntegrationsSectionCard = ({ icon, iconClassName, cardClassName, title, description, badges, delay = 0 }: Props) => {
    const initial = { opacity: 0, y: 20 };
    const animate = { opacity: 1, y: 0 };
    const transition = { duration: 0.5, delay };

    return (
        <Motion initial={initial} transition={transition} viewport={viewportOnce} whileInView={animate}>
            <Card className={`h-full border-border/40 ${cardClassName}`}>
                <CardContent className="p-6">
                    <div className={`size-12 rounded-full flex items-center justify-center mb-4 ${iconClassName}`}>{icon}</div>

                    <h3 className="text-xl font-bold mb-2">{title}</h3>

                    <p className="text-muted-foreground mb-4">{description}</p>

                    <div className="flex flex-wrap gap-2">{badges}</div>
                </CardContent>
            </Card>
        </Motion>
    );
};
