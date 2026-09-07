import { Trans } from '@lingui/react/macro';
import { GitBranch, Shield, Smartphone } from 'lucide-react';
import Link from 'next/link';

export const TrustBanner = () => (
    <section className="w-full py-6 border-b border-border/40 bg-muted/20">
        <h2 className="sr-only">
            <Trans>What Budgie guarantees</Trans>
        </h2>

        <div className="container px-4 md:px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:gap-x-12 text-sm">
                <div className="flex items-center gap-2">
                    <Shield className="size-4 text-green-500" />

                    <span>
                        <Trans>100% on-device</Trans>
                    </span>
                </div>

                <Link
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                    href="https://github.com/budgie-at/budgie"
                    rel="noopener noreferrer" // oxlint-disable-line lingui/no-unlocalized-strings
                    target="_blank"
                >
                    <GitBranch className="size-4" />

                    <span>
                        <Trans>Source-available on GitHub</Trans>
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    <Smartphone className="size-4 text-primary" />

                    <span>
                        <Trans>iOS and Android</Trans>
                    </span>
                </div>
            </div>
        </div>
    </section>
);
