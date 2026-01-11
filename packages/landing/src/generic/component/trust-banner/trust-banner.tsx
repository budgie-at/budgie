import { Trans } from '@lingui/react/macro';
import { Download, Github, Shield, Star, Zap } from 'lucide-react';

import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 10 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.4 };

export const TrustBanner = () => (
    <section className="w-full py-6 border-b border-border/40 bg-muted/20">
        <Motion animate={animatedMotion} className="container px-4 md:px-6" initial={initialMotion} transition={transitionMotion}>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm">
                <div className="flex items-center gap-2">
                    <div className="flex">
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    </div>

                    <span className="font-semibold">4.9</span>

                    <span className="text-muted-foreground">
                        <Trans>App Store</Trans>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Download className="size-4 text-primary" />

                    <span className="font-semibold">50K+</span>

                    <span className="text-muted-foreground">
                        <Trans>Downloads</Trans>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Shield className="size-4 text-green-500" />

                    <span className="font-semibold">100%</span>

                    <span className="text-muted-foreground">
                        <Trans>Offline & Private</Trans>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Github className="size-4" />

                    <span className="font-semibold">
                        <Trans>Open Source</Trans>
                    </span>

                    <span className="text-muted-foreground">
                        <Trans>Auditable Code</Trans>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Zap className="size-4 text-orange-500" />

                    <span className="font-semibold">£1,200+</span>

                    <span className="text-muted-foreground">
                        <Trans>Avg. Saved/Year</Trans>
                    </span>
                </div>
            </div>
        </Motion>
    </section>
);
