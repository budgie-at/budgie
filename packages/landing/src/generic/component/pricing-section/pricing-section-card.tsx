import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { Motion } from '../motion/motion';

import type { ReactNode } from 'react';

interface Props {
    title: ReactNode;
    subtitle: ReactNode;
    price: string;
    priceSuffix: ReactNode;
    priceNote?: ReactNode;
    button: ReactNode;
    features: ReactNode;
    delay?: number;
    highlight?: boolean;
    badge?: ReactNode;
}

const viewportOnce = { once: true };
const cardClassNameBase = 'h-full border-border/40 bg-background/50';
const cardClassNameHighlight = 'h-full border-2 border-primary relative bg-linear-to-b from-background to-primary/5';
const contentClassNameBase = 'p-6';
const contentClassNameHighlight = 'p-6 pt-8';
const priceWrapperClassNameWithNote = 'mb-2';
const priceWrapperClassNameNoNote = 'mb-6';

export const PricingSectionCard = ({
    title,
    subtitle,
    price,
    priceSuffix,
    priceNote,
    button,
    features,
    delay = 0,
    highlight,
    badge
}: Props) => {
    const initial = { opacity: 0, y: 20 };
    const animate = { opacity: 1, y: 0 };
    const transition = { duration: 0.5, delay };
    const cardClassName = highlight ? cardClassNameHighlight : cardClassNameBase;
    const contentClassName = highlight ? contentClassNameHighlight : contentClassNameBase;
    const priceWrapperClassName = priceNote ? priceWrapperClassNameWithNote : priceWrapperClassNameNoNote;

    return (
        <Motion initial={initial} transition={transition} viewport={viewportOnce} whileInView={animate}>
            <Card className={cardClassName}>
                {badge}

                <CardContent className={contentClassName}>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">{title}</h3>

                        <p className="text-muted-foreground text-sm">{subtitle}</p>
                    </div>

                    <div className={priceWrapperClassName}>
                        <span className="text-4xl font-bold">{price}</span>

                        <span className="text-muted-foreground">{priceSuffix}</span>
                    </div>

                    {priceNote ? <p className="text-sm text-green-600 dark:text-green-400 mb-6">{priceNote}</p> : null}

                    <div className="mb-6">{button}</div>

                    <ul className="space-y-3">{features}</ul>
                </CardContent>
            </Card>
        </Motion>
    );
};
