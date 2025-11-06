import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { Motion } from '../motion/motion';

import type { ReactNode } from 'react';

interface Props {
    title: string;
    description: string;
    icon: ReactNode;
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const FeaturesSectionItem = ({ title, description, icon }: Props) => (
    <Motion variants={itemVariants}>
        <Card className="h-full overflow-hidden border-border/40 bg-linear-to-b from-background to-muted/10 backdrop-blur-sm transition-all hover:shadow-md">
            <CardContent className="p-6 flex flex-col h-full">
                <div className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
                    {icon}
                </div>

                <h3 className="text-xl font-bold mb-2">{title}</h3>

                <p className="text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    </Motion>
);
