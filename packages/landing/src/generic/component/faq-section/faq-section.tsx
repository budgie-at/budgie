import { Trans } from '@lingui/react/macro';

import { FaqSectionAccordion } from '../faq-section-accordion/faq-section-accordion';
import { FaqSectionItem } from '../faq-section-item/faq-section-item';

export const FaqSection = () => (
    <section className="w-full py-8 md:py-20" id="faq">
        <div className="container section-split">
            <div className="section-split-head">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">
                    <Trans>Offline expense tracker FAQ</Trans>
                </h2>

                <p className="mt-3 text-base md:text-lg text-muted-foreground text-pretty">
                    <Trans>Where the data lives, what works offline, how bank sync avoids your login, and what it costs.</Trans>
                </p>
            </div>

            <div>
                <FaqSectionAccordion>
                    <FaqSectionItem
                        answer={
                            <Trans>
                                On your phone, and nowhere else. Budgie has no account system and no server of its own, so there is nothing
                                to upload and nothing for us to read. Set a PIN and the data is encrypted on the device with that PIN.
                            </Trans>
                        }
                        index={0}
                        question={<Trans>Where is my financial data stored?</Trans>}
                    />

                    <FaqSectionItem
                        answer={
                            <Trans>
                                Yes. Adding transactions, budgets, tags, analytics and every screen that reads your history run entirely
                                from the local database, so the app behaves the same in aeroplane mode. Only bank sync and exchange-rate
                                refreshes need a connection, and they catch up when you are back online.
                            </Trans>
                        }
                        index={1}
                        question={<Trans>Does Budgie work without an internet connection?</Trans>}
                    />

                    <FaqSectionItem
                        answer={
                            <Trans>
                                Yes. Monobank sync uses a personal API token that you generate yourself in your bank, and the request goes
                                from your phone straight to the bank. For other banks you import a statement file instead. Budgie never asks
                                for a banking password and there is no aggregator such as Plaid in between.
                            </Trans>
                        }
                        index={2}
                        question={<Trans>Can I sync my bank without giving Budgie my bank login?</Trans>}
                    />

                    <FaqSectionItem
                        answer={
                            <Trans>
                                The source is public, but the licence is not OSI-approved open source. Budgie ships under the O&apos;SAASY
                                licence: you can read every line on GitHub, fork it and contribute, while commercial redistribution stays
                                with the project.
                            </Trans>
                        }
                        index={3}
                        question={<Trans>Is Budgie open source?</Trans>}
                    />

                    <FaqSectionItem
                        answer={
                            <Trans>
                                No. Budgie is completely free, with no paywall and no paid tier. The expense tracker, bank sync, and
                                on-device AI never expire and never charge you.
                            </Trans>
                        }
                        index={4}
                        question={<Trans>Is there a subscription?</Trans>}
                    />
                </FaqSectionAccordion>
            </div>
        </div>
    </section>
);
