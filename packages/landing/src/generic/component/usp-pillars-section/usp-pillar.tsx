import { cva } from 'class-variance-authority';

import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { Motion } from '../motion/motion';

import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

const viewportOnce = { once: true };

const iconContainerVariants = cva('size-16 rounded-2xl bg-linear-to-br flex items-center justify-center mx-auto mb-4 shadow-lg', {
    variants: {
        variant: {
            blue: 'from-blue-500 to-cyan-500',
            orange: 'from-orange-500 to-yellow-500',
            green: 'from-green-500 to-emerald-500',
            purple: 'from-purple-500 to-pink-500'
        }
    }
});

type IconVariant = VariantProps<typeof iconContainerVariants>['variant'];

interface Props {
    readonly icon: ReactNode;
    readonly title: ReactNode;
    readonly description: ReactNode;
    readonly variant: IconVariant;
    readonly delay: number;
}

export const UspPillar = ({ icon, title, description, variant, delay }: Props) => {
    const pillarInitial = { opacity: 0, y: 30 };
    const pillarAnimate = { opacity: 1, y: 0 };
    const pillarTransition = { duration: 0.5, delay };

    return (
        <Motion initial={pillarInitial} transition={pillarTransition} viewport={viewportOnce} whileInView={pillarAnimate}>
            <Card className="h-full border-border/40 hover:border-primary/40 transition-colors">
                <CardContent className="p-6 text-center">
                    <div className={iconContainerVariants({ variant })}>{icon}</div>

                    <h3 className="text-xl font-bold mb-2">{title}</h3>

                    <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        </Motion>
    );
};
