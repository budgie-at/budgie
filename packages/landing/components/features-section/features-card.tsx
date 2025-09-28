import { Card } from '../ui/card/card';
import { CardContent } from '../ui/card/card-content';

import type { ReactNode } from 'react';

interface FeaturesCardProps {
    readonly title: string;
    readonly icon: ReactNode;
    readonly description: string;
}

export const FeaturesCard = ({ icon, title, description }: FeaturesCardProps) => (
    <Card className="h-full overflow-hidden border-border/40 bg-linear-to-b from-background to-muted/10 backdrop-blur-sm transition-all hover:shadow-md">
        <CardContent className="p-6 flex flex-col h-full">
            <div className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
                {icon}
            </div>

            <h3 className="text-xl font-bold mb-2">{title}</h3>

            <p className="text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);
