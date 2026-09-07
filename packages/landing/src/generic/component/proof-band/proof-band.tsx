import { Trans } from '@lingui/react/macro';
import { GitBranch } from 'lucide-react';
import Link from 'next/link';

import { Button } from '../../../ui/button';
import { ProofBandLink } from '../proof-band-link/proof-band-link';

interface Props {
    readonly locale: string;
}

export const ProofBand = ({ locale }: Props) => (
    <section className="w-full border-y border-border/60 bg-muted/30 py-8 md:py-20" id="proof">
        <div className="container px-4 md:px-6 max-w-7xl">
            <h2 className="max-w-2xl text-2xl md:text-4xl font-bold tracking-tight text-balance">
                <Trans>Why offline-first and source-available matter</Trans>
            </h2>

            <div className="mt-8 md:mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
                <div className="flex max-w-lg flex-col items-start gap-3">
                    <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                        <Trans>There is no server to phone home to</Trans>
                    </h3>

                    <p className="text-sm md:text-base leading-relaxed text-muted-foreground text-pretty">
                        <Trans>
                            Every transaction, budget and chart is computed from a SQLite database on your phone. There is no account to
                            create, so there is nothing to sign into, nothing to sync and nothing to leak. Turn the radio off and the app
                            behaves exactly the same.
                        </Trans>
                    </p>

                    <ProofBandLink href={`/${locale}/offline-first`}>
                        <Trans>How offline-first expense tracking works</Trans>
                    </ProofBandLink>
                </div>

                <div className="flex max-w-lg flex-col items-start gap-3">
                    <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                        <Trans>You do not have to take our word for it</Trans>
                    </h3>

                    <p className="text-sm md:text-base leading-relaxed text-muted-foreground text-pretty">
                        <Trans>
                            The application source is published under the O&apos;SAASY license, so anyone can read the code that touches
                            money, check that nothing is uploaded, and open an issue when it is not.
                        </Trans>
                    </p>

                    <Button asChild className="mt-2 rounded-full" size="lg">
                        {/* oxlint-disable-next-line lingui/no-unlocalized-strings */}
                        <Link href="https://github.com/budgie-at/budgie" rel="noopener noreferrer" target="_blank">
                            <GitBranch aria-hidden="true" className="mr-2 size-4" />
                            <Trans>Read the source on GitHub</Trans>
                        </Link>
                    </Button>

                    <ProofBandLink href={`/${locale}/open-source`}>
                        <Trans>Source-available personal finance</Trans>
                    </ProofBandLink>

                    <ProofBandLink href={`/${locale}/security`}>
                        <Trans>Encryption, PIN lock and screenshot blur</Trans>
                    </ProofBandLink>
                </div>
            </div>
        </div>
    </section>
);
