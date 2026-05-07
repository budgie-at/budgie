import { Trans } from '@lingui/react/macro';
import { Github, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 10 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.4 };

export const TrustBanner = () => (
    <section className="w-full py-6 border-b border-border/40 bg-muted/20">
        <Motion animate={animatedMotion} className="container px-4 md:px-6" initial={initialMotion} transition={transitionMotion}>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm">
                <div className="flex items-center gap-2">
                    <Shield className="size-4 text-green-500" />

                    <span className="font-semibold">100%</span>

                    <span className="text-muted-foreground">
                        <Trans>On-Device — No Servers</Trans>
                    </span>
                </div>

                <Link
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                    href="https://github.com/rnw-community/budgie"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <Github className="size-4" />

                    <span className="font-semibold">
                        <Trans>Source-Available</Trans>
                    </span>

                    <span className="text-muted-foreground">
                        <Trans>on GitHub</Trans>
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    <Zap className="size-4 text-orange-500" />

                    <span className="font-semibold">
                        <Trans>Private Beta</Trans>
                    </span>

                    <span className="text-muted-foreground">
                        <Trans>Join the waitlist for early access</Trans>
                    </span>
                </div>
            </div>
        </Motion>
    </section>
);
