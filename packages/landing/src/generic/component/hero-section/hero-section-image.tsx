import { useLingui } from '@lingui/react/macro';
import Image from 'next/image';

import { Motion } from '../motion/motion';

const initialMotionImage = { opacity: 0, y: 40 };
const animatedMotionImage = { opacity: 1, y: 0 };
const transitionMotionImage = { duration: 0.7, delay: 0.2 };

export const HeroSectionImage = () => {
    const { t } = useLingui();

    return (
        <Motion
            animate={animatedMotionImage}
            className="relative mx-auto max-w-2xl"
            initial={initialMotionImage}
            transition={transitionMotionImage}
        >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/40 bg-linear-to-b from-background to-muted/20">
                <Image
                    alt={t`Budgie mobile app interface showing balance overview with multi-currency bank accounts including Monobank cards and various account types`}
                    className="w-full h-auto"
                    height={720}
                    priority
                    src="/images/design-mode/ai-budgeting-app-4x.jpg"
                    width={1280}
                />

                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 dark:ring-white/10" />
            </div>

            <div className="absolute -bottom-6 -right-6 -z-10 h-[400px] w-[400px] rounded-full bg-linear-to-br from-primary/30 to-secondary/30 blur-3xl opacity-70" />

            <div className="absolute -top-6 -left-6 -z-10 h-[400px] w-[400px] rounded-full bg-linear-to-br from-secondary/30 to-primary/30 blur-3xl opacity-70" />
        </Motion>
    );
};
