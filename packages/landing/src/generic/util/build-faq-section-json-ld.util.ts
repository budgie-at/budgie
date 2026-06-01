/* eslint-disable lingui/no-unlocalized-strings */
import type { FaqSectionJsonLdParamsInterface } from '../interface/faq-section-json-ld-params.interface';

export const buildFaqSectionJsonLd = ({
    privacyQuestion,
    privacyAnswer,
    bankSyncQuestion,
    bankSyncAnswer,
    assetsQuestion,
    assetsAnswer,
    multiDeviceQuestion,
    multiDeviceAnswer,
    licenseQuestion,
    licenseAnswer
}: FaqSectionJsonLdParamsInterface): Record<string, unknown> => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: privacyQuestion,
            acceptedAnswer: {
                '@type': 'Answer',
                text: privacyAnswer
            }
        },
        {
            '@type': 'Question',
            name: bankSyncQuestion,
            acceptedAnswer: {
                '@type': 'Answer',
                text: bankSyncAnswer
            }
        },
        {
            '@type': 'Question',
            name: assetsQuestion,
            acceptedAnswer: {
                '@type': 'Answer',
                text: assetsAnswer
            }
        },
        {
            '@type': 'Question',
            name: multiDeviceQuestion,
            acceptedAnswer: {
                '@type': 'Answer',
                text: multiDeviceAnswer
            }
        },
        {
            '@type': 'Question',
            name: licenseQuestion,
            acceptedAnswer: {
                '@type': 'Answer',
                text: licenseAnswer
            }
        }
    ]
});
