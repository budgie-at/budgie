import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { Motion } from '../motion/motion';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly iconClassName: string;
    readonly title: ReactNode;
    readonly description: ReactNode;
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const SecuritySectionCard = ({ icon, iconClassName, title, description }: Props) => (
    <Motion variants={itemVariants}>
        <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
            <CardContent className="p-6 flex gap-4">
                <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${iconClassName}`}>{icon}</div>

                <div>
                    <h3 className="text-lg font-semibold mb-1">{title}</h3>

                    <p className="text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    </Motion>
);
