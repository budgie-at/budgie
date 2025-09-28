'use client';

import { motion } from 'framer-motion';

import { Accordion } from '../ui/accordion/accordion';
import { Badge } from '../ui/badge';

import { FaqQuestion } from './faq-question';

const questions = [
    {
        question: 'How much does Budgie cost?',
        answer: 'Budgie Pro costs $20/month or $16/month when billed annually (20% savings). Whitelist members get an exclusive 25% discount for their first year. This premium pricing ensures we can maintain the highest privacy and security standards without relying on data monetization.'
    },
    {
        question: "Why isn't Budgie free like other expense trackers?",
        answer: "Free expense apps make money by selling your financial data or showing ads. Budgie's premium model means we work for you, not advertisers. Your subscription funds ongoing development, security updates, and ensures your data remains completely private—never sold or monetized."
    },
    {
        question: 'How is my financial data kept private?',
        answer: "Your data never leaves your device unless you explicitly sync with your own cloud storage. We don't have servers storing your financial information, and we can't see your transactions. Everything is encrypted locally on your device."
    },
    {
        question: 'Does bank sync work offline?',
        answer: 'Bank sync requires an internet connection to fetch new transactions, but once synced, you can view and categorize everything offline. The app works completely offline for manual expense entry and viewing your data.'
    },
    {
        question: 'What cryptocurrencies and assets can I track?',
        answer: 'Budgie supports tracking for major cryptocurrencies, stocks, ETFs, and traditional bank accounts. You can manually add any asset or connect supported exchanges and brokerages for automatic tracking.'
    },
    {
        question: 'Can I use Budgie across multiple devices?',
        answer: 'Yes! You can sync your data across devices using your own cloud storage (iCloud, Google Drive, Dropbox). Your data remains encrypted and private—we never see it during the sync process.'
    },
    {
        question: 'How does the open source license work?',
        answer: 'Budgie uses a source-available license that allows you to view, modify, and contribute to the code while ensuring only we can monetize the official app. This keeps the project sustainable while maintaining transparency.'
    },
    {
        question: 'Is there a free trial or money-back guarantee?',
        answer: "We offer a 14-day free trial so you can experience Budgie's privacy-first approach risk-free. If you're not completely satisfied within 30 days, we provide a full refund—no questions asked."
    }
];

export const FaqSection = () => (
    <section className="w-full py-20 md:py-32" id="faq">
        <div className="container px-4 md:px-6">
            <motion.div
                className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
            >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                    FAQ
                </Badge>

                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>

                <p className="max-w-[800px] text-muted-foreground md:text-lg">
                    Everything you need to know about Budgie&apos;s privacy-first approach to expense tracking.
                </p>
            </motion.div>

            <div className="mx-auto max-w-3xl">
                <Accordion className="w-full" collapsible type="single">
                    {questions.map(({ question, answer }, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            key={question}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            viewport={{ once: true }}
                            whileInView={{ opacity: 1, y: 0 }}
                        >
                            <FaqQuestion answer={answer} question={question} />
                        </motion.div>
                    ))}
                </Accordion>
            </div>
        </div>
    </section>
);
