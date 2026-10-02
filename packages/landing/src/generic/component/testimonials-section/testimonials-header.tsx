import { Trans } from '@lingui/react/macro';

export const TestimonialsHeader = () => (
    <div className="max-w-2xl mb-8 md:mb-12">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">
            <Trans>What beta testers changed after a week</Trans>
        </h2>

        <p className="mt-3 text-base md:text-lg text-muted-foreground text-pretty">
            <Trans>Quotes from anonymized beta tester feedback. Names and locations have been changed to protect privacy.</Trans>
        </p>
    </div>
);
