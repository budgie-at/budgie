import { Trans, useLingui } from '@lingui/react/macro';
import { Eye, Lock, Shield, ShieldCheck, Smartphone } from 'lucide-react';

import { Motion } from '../motion/motion';

import { SecuritySectionBadge } from './security-section-badge';

const rightColumnInitial = { opacity: 0, x: 20 };
const rightColumnAnimate = { opacity: 1, x: 0 };
const rightColumnTransition = { duration: 0.6, delay: 0.2 };
const viewportOnce = { once: true };

export const SecuritySectionVisual = () => {
    const { t } = useLingui();

    return (
        <Motion initial={rightColumnInitial} transition={rightColumnTransition} viewport={viewportOnce} whileInView={rightColumnAnimate}>
            <div className="relative bg-linear-to-br from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 rounded-3xl" />

                <div className="relative space-y-8">
                    <div className="flex items-center justify-center">
                        <div className="size-24 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
                            <ShieldCheck className="size-12 text-white" />
                        </div>
                    </div>

                    <div className="text-center space-y-4">
                        <h3 className="text-2xl font-bold">
                            <Trans>Your Data Stays Yours</Trans>
                        </h3>

                        <p className="text-muted-foreground max-w-sm mx-auto">
                            <Trans>
                                Unlike other apps, we can&apos;t access your data even if we wanted to. That&apos;s privacy by design.
                            </Trans>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SecuritySectionBadge icon={<Lock className="size-5 text-green-500" />} label={t`AES-256 Encrypted`} />
                        <SecuritySectionBadge icon={<Eye className="size-5 text-green-500" />} label={t`Zero Tracking`} />
                        <SecuritySectionBadge icon={<Smartphone className="size-5 text-green-500" />} label={t`Device-Only Storage`} />
                        <SecuritySectionBadge icon={<Shield className="size-5 text-green-500" />} label={t`No Data Mining`} />
                    </div>
                </div>
            </div>
        </Motion>
    );
};
