/* oxlint-disable lingui/no-unlocalized-strings */
import type { FaqSectionJsonLdParamsInterface } from '../interface/faq-section-json-ld-params.interface';

export const buildFaqSectionJsonLd = ({
    storageQuestion,
    storageAnswer,
    offlineQuestion,
    offlineAnswer,
    bankLoginQuestion,
    bankLoginAnswer,
    openSourceQuestion,
    openSourceAnswer,
    subscriptionQuestion,
    subscriptionAnswer
}: FaqSectionJsonLdParamsInterface): Record<string, unknown> => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: storageQuestion,
            acceptedAnswer: { '@type': 'Answer', text: storageAnswer }
        },
        {
            '@type': 'Question',
            name: offlineQuestion,
            acceptedAnswer: { '@type': 'Answer', text: offlineAnswer }
        },
        {
            '@type': 'Question',
            name: bankLoginQuestion,
            acceptedAnswer: { '@type': 'Answer', text: bankLoginAnswer }
        },
        {
            '@type': 'Question',
            name: openSourceQuestion,
            acceptedAnswer: { '@type': 'Answer', text: openSourceAnswer }
        },
        {
            '@type': 'Question',
            name: subscriptionQuestion,
            acceptedAnswer: { '@type': 'Answer', text: subscriptionAnswer }
        }
    ]
});
