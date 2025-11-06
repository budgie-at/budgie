import { Trans, useLingui } from '@lingui/react/macro';

import { Accordion } from '../../../ui/accordion/accordion';
import { Badge } from '../../../ui/badge';
import { FaqSectionItem } from '../faq-section-item/faq-section-item';
import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

export const FaqSection = () => {
    const { t } = useLingui();

    return (
        <section className="w-full py-20 md:py-32" id="faq">
            <div className="container px-4 md:px-6">
                <Motion
                    className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                    initial={initialMotion}
                    transition={transitionMotion}
                    viewport={viewportOnce}
                    whileInView={animatedMotion}
                >
                    <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                        <Trans>FAQ</Trans>
                    </Badge>

                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        <Trans>Frequently Asked Questions</Trans>
                    </h2>

                    <p className="max-w-[800px] text-muted-foreground md:text-lg">
                        <Trans>Everything you need to know about Budgie&apos;s privacy-first approach to expense tracking.</Trans>
                    </p>
                </Motion>

                <div className="mx-auto max-w-3xl">
                    <Accordion className="w-full" collapsible type="single">
                        <FaqSectionItem
                            answer={t`Budgie Pro costs $20/month or $16/month when billed annually (20% savings). Whitelist members get an exclusive 25% discount for their first year. This premium pricing ensures we can maintain the highest privacy and security standards without relying on data monetization.`}
                            index={0}
                            question={t`How much does Budgie cost?`}
                        />

                        <FaqSectionItem
                            answer={t`Free expense apps make money by selling your financial data or showing ads. Budgie's premium model means we work for you, not advertisers. Your subscription funds ongoing development, security updates, and ensures your data remains completely private—never sold or monetized.`}
                            index={1}
                            question={t`Why isn't Budgie free like other expense trackers?`}
                        />

                        <FaqSectionItem
                            answer={t`Your data never leaves your device unless you explicitly sync with your own cloud storage. We don't have servers storing your financial information, and we can't see your transactions. Everything is encrypted locally on your device.`}
                            index={2}
                            question={t`How is my financial data kept private?`}
                        />

                        <FaqSectionItem
                            answer={t`Bank sync requires an internet connection to fetch new transactions, but once synced, you can view and categorize everything offline. The app works completely offline for manual expense entry and viewing your data.`}
                            index={3}
                            question={t`Does bank sync work offline?`}
                        />

                        <FaqSectionItem
                            answer={t`Budgie supports tracking for major cryptocurrencies, stocks, ETFs, and traditional bank accounts. You can manually add any asset or connect supported exchanges and brokerages for automatic tracking.`}
                            index={4}
                            question={t`What cryptocurrencies and assets can I track?`}
                        />

                        <FaqSectionItem
                            answer={t`'Yes! You can sync your data across devices using your own cloud storage (iCloud, Google Drive, Dropbox). Your data remains encrypted and private—we never see it during the sync process.`}
                            index={5}
                            question={t`Can I use Budgie across multiple devices?`}
                        />

                        <FaqSectionItem
                            answer={t`Budgie uses a source-available license that allows you to view, modify, and contribute to the code while ensuring only we can monetize the official app. This keeps the project sustainable while maintaining transparency.`}
                            index={6}
                            question={t`How does the open source license work?`}
                        />

                        <FaqSectionItem
                            answer={t`We offer a 14-day free trial so you can experience Budgie's privacy-first approach risk-free. If you're not completely satisfied within 30 days, we provide a full refund—no questions asked.`}
                            index={7}
                            question={t`Is there a free trial or money-back guarantee?`}
                        />
                    </Accordion>
                </div>
            </div>
        </section>
    );
};
