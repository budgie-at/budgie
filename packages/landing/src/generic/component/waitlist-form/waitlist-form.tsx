'use client';

import { msg, plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ArrowRight, Loader2, Users } from 'lucide-react';
import { useState } from 'react';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../ui/button';
import { joinWaitlist } from '../../action/waitlist.action';
import { WaitlistMessageKeyEnum } from '../../enum/waitlist-message-key.enum';

import { WaitlistSuccess } from './waitlist-success';

import type { MessageDescriptor } from '@lingui/core';

interface Props {
    variant?: 'hero' | 'cta';
    showCount?: boolean;
    initialCount?: number;
}

const inputVariants = cva(
    'h-14 px-6 rounded-full border-2 backdrop-blur-sm focus:ring-2 outline-none transition-all text-lg w-full sm:w-auto sm:min-w-[300px]',
    {
        variants: {
            variant: {
                hero: 'border-border/50 bg-background/80 focus:border-primary focus:ring-primary/20',
                cta: 'border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:border-white focus:ring-white/20'
            }
        }
    }
);

const buttonVariants = cva('rounded-full h-14 px-8 text-lg font-semibold transition-all', {
    variants: {
        variant: {
            hero: 'bg-linear-to-r from-primary to-primary/80 hover:opacity-90',
            cta: 'bg-white text-red-600 hover:bg-white/90'
        }
    }
});

const countTextVariants = cva('flex items-center gap-2 text-sm', {
    variants: {
        variant: {
            hero: 'text-muted-foreground',
            cta: 'text-white/70'
        }
    }
});

const disclaimerVariants = cva('text-xs', {
    variants: {
        variant: {
            hero: 'text-muted-foreground/70',
            cta: 'text-white/50'
        }
    }
});

const errorVariants = cva('text-sm', {
    variants: {
        variant: {
            hero: 'text-red-500',
            cta: 'text-white-500'
        }
    }
});
const WAITLIST_ERROR_MESSAGES: Partial<Record<WaitlistMessageKeyEnum, MessageDescriptor>> = {
    [WaitlistMessageKeyEnum.ERROR]: msg`We couldn't save your email. Please try again.`,
    [WaitlistMessageKeyEnum.INVALID_EMAIL]: msg`Please enter a valid email address.`
};
const WAITLIST_CONFIRMATION_ERROR_MESSAGE = msg`We couldn't confirm your signup. Please try again.`;
const WAITLIST_CONFIRMATION_DEADLINE_MS = 8000;

export const WaitlistForm = ({ variant = 'hero', showCount = true, initialCount = 0 }: Props) => {
    const { i18n, t } = useLingui();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [position, setPosition] = useState<number | undefined>();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        let confirmationDeadlineTimer: number | undefined;

        try {
            const confirmationDeadline = new Promise<never>((_resolve, reject) => {
                confirmationDeadlineTimer = window.setTimeout(() => void reject(new Error()), WAITLIST_CONFIRMATION_DEADLINE_MS);
            });
            const result = await Promise.race([joinWaitlist(email), confirmationDeadline]);

            if (
                (result.messageKey === WaitlistMessageKeyEnum.SUCCESS || result.messageKey === WaitlistMessageKeyEnum.ALREADY_REGISTERED) &&
                isPositiveNumber(result.position)
            ) {
                setPosition(result.position);
            } else {
                setError(i18n._(WAITLIST_ERROR_MESSAGES[result.messageKey] ?? WAITLIST_CONFIRMATION_ERROR_MESSAGE));
            }
        } catch {
            setError(i18n._(WAITLIST_CONFIRMATION_ERROR_MESSAGE));
        } finally {
            window.clearTimeout(confirmationDeadlineTimer);
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setError('');
    };

    if (isPositiveNumber(position)) {
        return <WaitlistSuccess position={position} variant={variant} />;
    }

    const countText = t({
        message: plural(initialCount, {
            one: '#+ person already waiting',
            other: '#+ people already waiting'
        })
    });
    const isButtonDisabled = isLoading || !isNotEmptyString(email);

    return (
        <div className="flex flex-col items-center gap-4">
            <form className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto" onSubmit={handleSubmit}>
                <input
                    className={inputVariants({ variant })}
                    disabled={isLoading}
                    onChange={handleChange}
                    placeholder={t`Enter your email`}
                    required
                    type="email"
                    value={email}
                />

                <Button className={buttonVariants({ variant })} disabled={isButtonDisabled} size="lg" type="submit">
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

            {showCount && isPositiveNumber(initialCount) && (
                <div className={countTextVariants({ variant })}>
                    <Users className="size-4" />
                    <span>{countText}</span>
                </div>
            )}

            <p className={disclaimerVariants({ variant })}>
                <Trans>No spam, ever. Unsubscribe anytime.</Trans>
            </p>
        </div>
    );
};
