import { Trans } from '@lingui/react/macro';

export const ComparisonSectionHeader = () => (
    <div className="max-w-2xl mb-8 md:mb-12">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">
            <Trans>Budgie vs cloud budgeting apps</Trans>
        </h2>

        <p className="mt-3 text-base md:text-lg text-muted-foreground text-pretty">
            <Trans>We believe in transparency. Here&apos;s an honest comparison with other popular budgeting apps.</Trans>
        </p>
    </div>
);
