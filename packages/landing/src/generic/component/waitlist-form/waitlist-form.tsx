'use client';

import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ArrowRight, Loader2, Users } from 'lucide-react';
import { useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../ui/button';
import { joinWaitlist } from '../../action/waitlist.action';

import { WaitlistSuccess } from './waitlist-success';

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

export const WaitlistForm = ({ variant = 'hero', showCount = true, initialCount = 0 }: Props) => {
    const { t } = useLingui();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [position, setPosition] = useState<number | undefined>();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await joinWaitlist(email);
        setIsLoading(false);

        if (result.success) {
            setIsSuccess(true);
            setPosition(result.position);
        } else {
            setError(t`Something went wrong. Please try again.`);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setError('');
    };

    if (isSuccess) {
        return <WaitlistSuccess position={position} variant={variant} />;
    }

    const formattedCount = initialCount.toLocaleString();
    const countText = t`${formattedCount}+ people already waiting`;
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

            {isNotEmptyString(error) && <p className={errorVariants({ variant })}>{error}</p>}

            {showCount && initialCount > 0 && (
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
