import { Trans } from '@lingui/react/macro';
import { GitBranch, Shield, Smartphone } from 'lucide-react';

export const TrustBanner = () => (
    <section className="w-full border-b border-border/40 bg-muted/20 py-6">
        <h2 className="sr-only">
            <Trans>What Budgie guarantees</Trans>
        </h2>

        <div className="container px-4 md:px-6 max-w-7xl">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm md:gap-x-12">
                <p className="flex items-center gap-2">
                    <Shield aria-hidden="true" className="size-4 text-green-600 dark:text-green-500" />
                    <Trans>100% on-device</Trans>
                </p>

                <p className="flex items-center gap-2">
                    <GitBranch aria-hidden="true" className="size-4 text-muted-foreground" />
                    <Trans>Source-available on GitHub</Trans>
                </p>

                <p className="flex items-center gap-2">
                    <Smartphone aria-hidden="true" className="size-4 text-muted-foreground" />
                    <Trans>iOS and Android</Trans>
                </p>
            </div>
        </div>
    </section>
);
