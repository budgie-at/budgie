'use client';

import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { CheckCircle, Sparkles } from 'reicon-react';

import { isPositiveNumber } from '@rnw-community/shared';

import { WaitlistVariantEnum } from '../../enum/waitlist-variant.enum';

interface Props {
    readonly variant: WaitlistVariantEnum;
    readonly position?: number;
}

const containerVariants = cva('flex flex-col gap-4 animate-in fade-in duration-500', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]: 'items-center',
            [WaitlistVariantEnum.CTA]: 'items-center',
            [WaitlistVariantEnum.FEATURE]: 'items-start'
        }
    }
});

const positionTextVariants = cva('', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]: 'text-muted-foreground',
            [WaitlistVariantEnum.CTA]: 'text-white/80',
            [WaitlistVariantEnum.FEATURE]: 'text-muted-foreground'
        }
    }
});

const discountTextVariants = cva('text-sm', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]: 'text-muted-foreground',
            [WaitlistVariantEnum.CTA]: 'text-white/70',
            [WaitlistVariantEnum.FEATURE]: 'text-muted-foreground'
        }
    }
});

const WAITLIST_BASE_POSITION = 847;

export const WaitlistSuccess = ({ variant, position }: Props) => {
    const displayPosition = WAITLIST_BASE_POSITION + (position ?? 0);

    return (
        <div className={containerVariants({ variant })}>
            <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="size-6" />

                <span className="text-lg font-semibold">
                    <Trans>You&apos;re in!</Trans>
                </span>
            </div>

            {isPositiveNumber(position) && (
                <p className={positionTextVariants({ variant })}>
                    <Trans>You&apos;re #{displayPosition} on the waitlist. We&apos;ll notify you when Budgie launches!</Trans>
                </p>
            )}

            <div className="flex items-center gap-2 mt-2">
                <Sparkles className="size-4 text-yellow-500" />

                <span className={discountTextVariants({ variant })}>
                    <Trans>Budgie is completely free — nothing to unlock later</Trans>
                </span>
            </div>
        </div>
    );
};
