import { Trans, useLingui } from '@lingui/react/macro';

import { extractTransMessage } from '../../../i18n/util/extract-trans-message.util';
import { Accordion } from '../../../ui/accordion/accordion';
import { buildFaqSectionJsonLd } from '../../util/build-faq-section-json-ld.util';
import { FaqSectionItem } from '../faq-section-item/faq-section-item';
import { JsonLd } from '../json-ld/json-ld';

export const FaqSectionAccordion = () => {
    const { i18n } = useLingui();

    const storageQuestion = <Trans>Where is my financial data stored?</Trans>;
    const storageAnswer = (
        <Trans>
            In a SQLite database on your phone, and nowhere else. Budgie has no account system and no server of its own, so there is nothing
            to upload and nothing for us to read. Set a PIN and the database is encrypted on the device with SQLCipher using that PIN.
        </Trans>
    );
    const offlineQuestion = <Trans>Does Budgie work without an internet connection?</Trans>;
    const offlineAnswer = (
        <Trans>
            Yes. Adding transactions, budgets, tags, analytics and every screen that reads your history run entirely from the local
            database, so the app behaves the same in aeroplane mode. Only bank sync and exchange-rate refreshes need a connection, and they
            catch up when you are back online.
        </Trans>
    );
    const bankLoginQuestion = <Trans>Can I sync my bank without giving Budgie my bank login?</Trans>;
    const bankLoginAnswer = (
        <Trans>
            Yes. Monobank sync uses a personal API token that you generate yourself in your bank, and the request goes from your phone
            straight to the bank. For other banks you import a statement file instead. Budgie never asks for a banking password and there is
            no aggregator such as Plaid in between.
        </Trans>
    );
    const openSourceQuestion = <Trans>Is Budgie open source?</Trans>;
    const openSourceAnswer = (
        <Trans>
            The source is public, but the licence is not OSI-approved open source. Budgie ships under the O&apos;SAASY licence: you can read
            every line on GitHub, fork it and contribute, while commercial redistribution stays with the project.
        </Trans>
    );
    const subscriptionQuestion = <Trans>Is there a subscription?</Trans>;
    const subscriptionAnswer = (
        <Trans>
            No. The expense tracker itself never expires and has no paywall. Bank sync and on-device AI are an optional one-time unlock, not
            a recurring charge.
        </Trans>
    );
    const faqPage = buildFaqSectionJsonLd({
        storageQuestion: extractTransMessage(storageQuestion, i18n),
        storageAnswer: extractTransMessage(storageAnswer, i18n),
        offlineQuestion: extractTransMessage(offlineQuestion, i18n),
        offlineAnswer: extractTransMessage(offlineAnswer, i18n),
        bankLoginQuestion: extractTransMessage(bankLoginQuestion, i18n),
        bankLoginAnswer: extractTransMessage(bankLoginAnswer, i18n),
        openSourceQuestion: extractTransMessage(openSourceQuestion, i18n),
        openSourceAnswer: extractTransMessage(openSourceAnswer, i18n),
        subscriptionQuestion: extractTransMessage(subscriptionQuestion, i18n),
        subscriptionAnswer: extractTransMessage(subscriptionAnswer, i18n)
    });

    return (
        <>
            <JsonLd data={faqPage} />
            <Accordion className="w-full" collapsible type="single">
                <FaqSectionItem answer={storageAnswer} index={0} question={storageQuestion} />

                <FaqSectionItem answer={offlineAnswer} index={1} question={offlineQuestion} />

                <FaqSectionItem answer={bankLoginAnswer} index={2} question={bankLoginQuestion} />

                <FaqSectionItem answer={openSourceAnswer} index={3} question={openSourceQuestion} />

                <FaqSectionItem answer={subscriptionAnswer} index={4} question={subscriptionQuestion} />
            </Accordion>
        </>
    );
};
