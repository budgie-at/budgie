'use client';

import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { CheckCircle2, Sparkles } from 'lucide-react';

import { isPositiveNumber } from '@rnw-community/shared';

interface Props {
    variant: 'hero' | 'cta';
    position?: number;
}

const positionTextVariants = cva('', {
    variants: {
        variant: {
            hero: 'text-muted-foreground',
            cta: 'text-white/80'
        }
    }
});

const discountTextVariants = cva('text-sm', {
    variants: {
        variant: {
            hero: 'text-muted-foreground',
            cta: 'text-white/70'
        }
    }
});

const WAITLIST_BASE_POSITION = 847;

export const WaitlistSuccess = ({ variant, position }: Props) => {
    const { t } = useLingui();

    const displayPosition = WAITLIST_BASE_POSITION + (position ?? 0);

    return (
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="size-6" />

                <span className="text-lg font-semibold">
                    <Trans>You&apos;re in!</Trans>
                </span>
            </div>

            {isPositiveNumber(position) && (
                <p className={positionTextVariants({ variant })}>
                    {t`You're #${displayPosition} on the waitlist. We'll notify you when Budgie launches!`}
                </p>
            )}

            <div className="flex items-center gap-2 mt-2">
                <Sparkles className="size-4 text-yellow-500" />

                <span className={discountTextVariants({ variant })}>
                    <Trans>Early access members get 50% off lifetime</Trans>
                </span>
            </div>
        </div>
    );
};
