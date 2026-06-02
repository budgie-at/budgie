import { Trans, useLingui } from '@lingui/react/macro';

import { extractTransMessage } from '../../../i18n/util/extract-trans-message.util';
import { Accordion } from '../../../ui/accordion/accordion';
import { buildFaqSectionJsonLd } from '../../util/build-faq-section-json-ld.util';
import { FaqSectionItem } from '../faq-section-item/faq-section-item';
import { JsonLd } from '../json-ld/json-ld';

export const FaqSectionAccordion = () => {
    const { i18n } = useLingui();

    const privacyQuestion = <Trans>How is my financial data kept private?</Trans>;
    const privacyAnswer = (
        <Trans>
            Your data never leaves your device unless you explicitly sync with your own cloud storage. We don&apos;t have servers storing
            your financial information, and we can&apos;t see your transactions. Everything is encrypted locally on your device.
        </Trans>
    );
    const bankSyncQuestion = <Trans>Does bank sync work offline?</Trans>;
    const bankSyncAnswer = (
        <Trans>
            Bank sync requires an internet connection to fetch new transactions, but once synced, you can view and categorize everything
            offline. The app works completely offline for manual expense entry and viewing your data.
        </Trans>
    );
    const assetsQuestion = <Trans>What cryptocurrencies and assets can I track?</Trans>;
    const assetsAnswer = (
        <Trans>
            Budgie supports manual tracking of Bitcoin, Ethereum, other crypto, stocks, ETFs, and traditional bank accounts. Import
            positions and transactions via CSV. There are no automatic exchange or brokerage API integrations — your data stays on-device.
        </Trans>
    );
    const multiDeviceQuestion = <Trans>Can I use Budgie across multiple devices?</Trans>;
    const multiDeviceAnswer = (
        <Trans>
            Yes — export your encrypted database as a single file, save it to any storage you control (iCloud, Google Drive, Dropbox,
            anywhere), and import it on another device. The file stays encrypted with your PIN; we never see it because we have no servers.
        </Trans>
    );
    const licenseQuestion = <Trans>How does the source-available license work?</Trans>;
    const licenseAnswer = (
        <Trans>
            Budgie uses a custom source-available license that lets you read, fork, and contribute to the code, while reserving commercial
            distribution to the project. The full source is on GitHub — you can audit every line.
        </Trans>
    );
    const faqPage = buildFaqSectionJsonLd({
        privacyQuestion: extractTransMessage(privacyQuestion, i18n),
        privacyAnswer: extractTransMessage(privacyAnswer, i18n),
        bankSyncQuestion: extractTransMessage(bankSyncQuestion, i18n),
        bankSyncAnswer: extractTransMessage(bankSyncAnswer, i18n),
        assetsQuestion: extractTransMessage(assetsQuestion, i18n),
        assetsAnswer: extractTransMessage(assetsAnswer, i18n),
        multiDeviceQuestion: extractTransMessage(multiDeviceQuestion, i18n),
        multiDeviceAnswer: extractTransMessage(multiDeviceAnswer, i18n),
        licenseQuestion: extractTransMessage(licenseQuestion, i18n),
        licenseAnswer: extractTransMessage(licenseAnswer, i18n)
    });

    return (
        <>
            <JsonLd data={faqPage} />
            <Accordion className="w-full" collapsible type="single">
                <FaqSectionItem answer={privacyAnswer} index={0} question={privacyQuestion} />

                <FaqSectionItem answer={bankSyncAnswer} index={1} question={bankSyncQuestion} />

                <FaqSectionItem answer={assetsAnswer} index={2} question={assetsQuestion} />

                <FaqSectionItem answer={multiDeviceAnswer} index={3} question={multiDeviceQuestion} />

                <FaqSectionItem answer={licenseAnswer} index={4} question={licenseQuestion} />
            </Accordion>
        </>
    );
};
