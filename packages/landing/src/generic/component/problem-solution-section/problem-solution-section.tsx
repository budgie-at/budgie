import { Trans } from '@lingui/react/macro';

import { Motion } from '../motion/motion';

import { ProblemSolutionCard } from './problem-solution-card';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

export const ProblemSolutionSection = () => (
    <section className="w-full py-20 md:py-28">
        <div className="container px-4 md:px-6">
            <Motion
                className="text-center mb-16"
                initial={initialMotion}
                transition={transitionMotion}
                viewport={viewportOnce}
                whileInView={animatedMotion}
            >
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                    <Trans>Why Most Budgeting Apps Get It Wrong</Trans>
                </h2>

                <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
                    <Trans>
                        Cloud-based apps store your financial data on their servers. That means they can see everything—and so can hackers.
                    </Trans>
                </p>
            </Motion>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <ProblemSolutionCard variant="problem" />
                <ProblemSolutionCard variant="solution" />
            </div>
        </div>
    </section>
);
