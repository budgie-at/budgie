import { Trans } from '@lingui/react/macro';
import { Cloud, Smartphone } from 'lucide-react';

import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { Motion } from '../motion/motion';

import { ProblemItems } from './problem-items';
import { SolutionItems } from './solution-items';

import type { ReactNode } from 'react';

const viewportOnce = { once: true };

interface Props {
    readonly variant: 'problem' | 'solution';
}

export const ProblemSolutionCard = ({ variant }: Props) => {
    const isProblem = variant === 'problem';

    const cardInitial = isProblem ? { opacity: 0, x: -20 } : { opacity: 0, x: 20 };
    const cardAnimate = { opacity: 1, x: 0 };
    const cardTransition = isProblem ? { duration: 0.5, delay: 0.1 } : { duration: 0.5, delay: 0.2 };

    const cardClassName = isProblem
        ? 'h-full border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20'
        : 'h-full border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20 ring-2 ring-green-500/20';

    const iconContainerClassName = isProblem
        ? 'size-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center'
        : 'size-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center';

    const titleClassName = isProblem
        ? 'text-xl font-bold text-red-700 dark:text-red-400'
        : 'text-xl font-bold text-green-700 dark:text-green-400';

    const subtitleClassName = isProblem
        ? 'text-sm text-red-600/70 dark:text-red-400/70'
        : 'text-sm text-green-600/70 dark:text-green-400/70';

    const icon: ReactNode = isProblem ? <Cloud className="size-6 text-red-600" /> : <Smartphone className="size-6 text-green-600" />;
    const title = isProblem ? <Trans>Cloud-Based Apps</Trans> : <Trans>Budgie (Offline-First)</Trans>;
    const subtitle = isProblem ? <Trans>The risky approach</Trans> : <Trans>The private approach</Trans>;

    return (
        <Motion initial={cardInitial} transition={cardTransition} viewport={viewportOnce} whileInView={cardAnimate}>
            <Card className={cardClassName}>
                <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className={iconContainerClassName}>{icon}</div>

                        <div>
                            <h3 className={titleClassName}>{title}</h3>
                            <p className={subtitleClassName}>{subtitle}</p>
                        </div>
                    </div>

                    <ul className="space-y-4">{isProblem ? <ProblemItems /> : <SolutionItems />}</ul>
                </CardContent>
            </Card>
        </Motion>
    );
};
