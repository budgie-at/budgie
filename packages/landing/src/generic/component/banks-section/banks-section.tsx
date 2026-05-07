import { Trans, useLingui } from '@lingui/react/macro';

import { BanksSectionItem } from '../banks-section-item/banks-section-item';

export const BanksSection = () => {
    const { t } = useLingui();

    return (
        <section className="w-full py-12 border-y bg-muted/30">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                        <Trans>
                            Direct Monobank API sync, plus PDF/Excel/CSV imports for any bank in the world
                        </Trans>
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
                        <BanksSectionItem name={t`Monobank`} />
                        <BanksSectionItem name={t`PrivatBank`} />
                        <BanksSectionItem name={t`Erste Bank`} />
                    </div>
                </div>
            </div>
        </section>
    );
};
