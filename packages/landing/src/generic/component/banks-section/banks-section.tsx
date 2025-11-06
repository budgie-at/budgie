import { Trans, useLingui } from '@lingui/react/macro';

import { BanksSectionItem } from '../banks-section-item/banks-section-item';

export const BanksSection = () => {
    const { t } = useLingui();

    return (
        <section className="w-full py-12 border-y bg-muted/30">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                        <Trans>Syncs with 1000+ banks and financial institutions</Trans>
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
                        <BanksSectionItem name={t`Chase`} />
                        <BanksSectionItem name={t`Bank of America`} />
                        <BanksSectionItem name={t`Wells Fargo`} />
                        <BanksSectionItem name={t`Coinbase`} />
                        <BanksSectionItem name={t`Robinhood`} />
                    </div>
                </div>
            </div>
        </section>
    );
};
