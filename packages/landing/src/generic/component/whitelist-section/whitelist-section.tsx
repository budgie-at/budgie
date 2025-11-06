import { Trans } from '@lingui/react/macro';

import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { Motion } from '../motion/motion';
import { WhitelistSectionOffer } from '../whitelist-section-offer/whitelist-section-offer';

const motionInitial = { opacity: 0, y: 20 };
const motionTransition = { duration: 0.5 };
const motionViewport = { once: true };
const motionWhileInView = { opacity: 1, y: 0 };

export const WhitelistSection = () => (
    <section
        className="w-full py-20 md:py-32 bg-linear-to-br from-primary/5 via-primary/10 to-secondary/5 relative overflow-hidden"
        id="whitelist"
    >
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]" />

        <div className="container px-4 md:px-6 relative">
            <Motion
                className="max-w-4xl mx-auto"
                initial={motionInitial}
                transition={motionTransition}
                viewport={motionViewport}
                whileInView={motionWhileInView}
            >
                <Card className="relative overflow-hidden border-2 border-primary/30 bg-linear-to-br from-background via-background to-primary/5 backdrop-blur-sm shadow-2xl">
                    <div className="whitespace-nowrap absolute top-0 left-1/2 -translate-x-1/2 bg-linear-to-r from-primary to-secondary text-primary-foreground px-8 py-3 text-sm font-bold rounded-b-xl shadow-lg">
                        <Trans>🎉 EXCLUSIVE WHITELIST OFFER</Trans>
                    </div>

                    <CardContent className="p-8 md:p-12">
                        <WhitelistSectionOffer />
                    </CardContent>
                </Card>
            </Motion>
        </div>
    </section>
);
