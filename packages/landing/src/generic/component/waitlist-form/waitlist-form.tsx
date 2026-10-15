'use client';

import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useId, useState } from 'react';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../ui/button';
import { joinWaitlist } from '../../action/waitlist.action';
import { WaitlistMessageKeyEnum } from '../../enum/waitlist-message-key.enum';
import { WaitlistVariantEnum } from '../../enum/waitlist-variant.enum';
import { useWaitlistCount } from '../../hook/use-waitlist-count.hook';

import { WaitlistCount } from './waitlist-count';
import { WaitlistSuccess } from './waitlist-success';

import type { MessageDescriptor } from '@lingui/core';

interface Props {
    readonly variant?: WaitlistVariantEnum;
    readonly showCount?: boolean;
}

const containerVariants = cva('flex flex-col', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]: 'items-center gap-4',
            [WaitlistVariantEnum.CTA]: 'items-center gap-4',
            [WaitlistVariantEnum.FEATURE]: 'w-full max-w-[30rem] items-stretch gap-2'
        }
    }
});

const labelVariants = cva('', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]: 'sr-only',
            [WaitlistVariantEnum.CTA]: 'sr-only',
            [WaitlistVariantEnum.FEATURE]: 'text-sm text-muted-foreground'
        }
    }
});

const formVariants = cva('flex flex-col w-full', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]: 'gap-3 sm:flex-row sm:w-auto',
            [WaitlistVariantEnum.CTA]: 'gap-3 sm:flex-row sm:w-auto',
            [WaitlistVariantEnum.FEATURE]: 'gap-2 min-[480px]:flex-row min-[480px]:flex-wrap'
        }
    }
});

const inputVariants = cva('outline-none transition-all w-full', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]:
                'h-14 px-6 rounded-full border-2 backdrop-blur-sm focus:ring-2 text-lg sm:w-auto sm:min-w-[300px] border-border/50 bg-background/80 focus:border-primary focus:ring-primary/20',
            [WaitlistVariantEnum.CTA]:
                'h-14 px-6 rounded-full border-2 backdrop-blur-sm focus:ring-2 text-lg sm:w-auto sm:min-w-[300px] border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:border-white focus:ring-white/20',
            [WaitlistVariantEnum.FEATURE]:
                'h-12 min-w-0 min-[480px]:min-w-[14rem] min-[480px]:flex-1 rounded-[0.875rem] border border-border bg-muted/50 px-4 text-[1.0625rem] placeholder:text-muted-foreground focus-visible:border-pillar focus-visible:ring-2 focus-visible:ring-pillar/25'
        }
    }
});

const buttonVariants = cva('font-semibold transition-all', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]:
                'rounded-full h-14 px-5 sm:px-8 text-base sm:text-lg bg-primary text-primary-foreground hover:bg-primary/90',
            [WaitlistVariantEnum.CTA]: 'rounded-full h-14 px-5 sm:px-8 text-base sm:text-lg bg-white text-primary hover:bg-white/90',
            [WaitlistVariantEnum.FEATURE]:
                'h-12 w-full rounded-[0.875rem] px-6 text-base bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-pillar min-[480px]:w-auto min-[480px]:flex-none'
        }
    }
});

const disclaimerVariants = cva('text-xs', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]: 'text-muted-foreground',
            [WaitlistVariantEnum.CTA]: 'text-white/90',
            [WaitlistVariantEnum.FEATURE]: 'sr-only'
        }
    }
});

const errorVariants = cva('text-sm', {
    variants: {
        variant: {
            [WaitlistVariantEnum.HERO]: 'text-red-500',
            [WaitlistVariantEnum.CTA]: 'text-white',
            [WaitlistVariantEnum.FEATURE]: 'text-red-600 dark:text-red-400'
        }
    }
});
const WAITLIST_ERROR_MESSAGES: Partial<Record<WaitlistMessageKeyEnum, MessageDescriptor>> = {
    [WaitlistMessageKeyEnum.ERROR]: msg`We couldn't save your email. Please try again.`,
    [WaitlistMessageKeyEnum.INVALID_EMAIL]: msg`Please enter a valid email address.`
};
const WAITLIST_CONFIRMATION_ERROR_MESSAGE = msg`We couldn't confirm your signup. Please try again.`;
const WAITLIST_CONFIRMATION_DEADLINE_MS = 8000;

export const WaitlistForm = ({ variant = WaitlistVariantEnum.HERO, showCount = true }: Props) => {
    const { i18n, t } = useLingui();
    const inputId = useId();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [position, setPosition] = useState<number | undefined>();
    const [error, setError] = useState('');
    const initialCount = useWaitlistCount(showCount);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const outcome = await Effect.runPromise(
            Effect.tryPromise(async () => await joinWaitlist(email)).pipe(Effect.timeout(WAITLIST_CONFIRMATION_DEADLINE_MS), Effect.option)
        );

        if (Option.isNone(outcome)) {
            setError(i18n._(WAITLIST_CONFIRMATION_ERROR_MESSAGE));
        } else if (
            (outcome.value.messageKey === WaitlistMessageKeyEnum.SUCCESS ||
                outcome.value.messageKey === WaitlistMessageKeyEnum.ALREADY_REGISTERED) &&
            isPositiveNumber(outcome.value.position)
        ) {
            setPosition(outcome.value.position);
        } else {
            setError(i18n._(WAITLIST_ERROR_MESSAGES[outcome.value.messageKey] ?? WAITLIST_CONFIRMATION_ERROR_MESSAGE));
        }

        setIsLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setError('');
    };

    if (isPositiveNumber(position)) {
        return <WaitlistSuccess position={position} variant={variant} />;
    }

    return (
        <div className={containerVariants({ variant })}>
            <label className={labelVariants({ variant })} htmlFor={inputId}>
                <Trans>Get the app when it opens</Trans>
            </label>
            <form className={formVariants({ variant })} onSubmit={handleSubmit}>
                <input
                    autoComplete="email"
                    className={inputVariants({ variant })}
                    disabled={isLoading}
                    id={inputId}
                    onChange={handleChange}
                    placeholder={t`Enter your email`}
                    required
                    type="email"
                    value={email}
                />

                <Button className={buttonVariants({ variant })} disabled={isLoading} size="lg" type="submit">
                    {isLoading ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <>
                            <Trans>Join Waitlist</Trans>
                            <ArrowRight className="ml-2 size-5" />
                        </>
                    )}
                </Button>
            </form>

            {isNotEmptyString(error) && (
                <p className={errorVariants({ variant })} role="alert">
                    {error}
                </p>
            )}

            {showCount && isPositiveNumber(initialCount) && <WaitlistCount initialCount={initialCount} variant={variant} />}

            <p className={disclaimerVariants({ variant })}>
                <Trans>No spam, ever. Unsubscribe anytime.</Trans>
            </p>
        </div>
    );
};
