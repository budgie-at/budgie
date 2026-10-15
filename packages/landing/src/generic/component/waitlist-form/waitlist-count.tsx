'use client';

import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Users } from 'reicon-react';

import { WaitlistVariantEnum } from '../../enum/waitlist-variant.enum';

interface Props {
    readonly variant: WaitlistVariantEnum;
    readonly initialCount: number;
}

const countTextVariants = cva('flex items-center gap-2 text-sm', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]: 'text-muted-foreground',
            [WaitlistVariantEnum.CTA]: 'text-white/90',
            [WaitlistVariantEnum.FEATURE]: 'text-muted-foreground'
        }
    }
});

export const WaitlistCount = ({ variant, initialCount }: Props) => {
    const { t } = useLingui();

    return (
        <div className={countTextVariants({ variant })}>
            <Users className="size-4" />
            <span>
                {t({
                    message: plural(initialCount, {
                        one: '#+ person already waiting',
                        other: '#+ people already waiting'
                    })
                })}
            </span>
        </div>
    );
};
