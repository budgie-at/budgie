import { ExternalSourceEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { BANK_PROVIDER_TITLE } from '../constant/bank-provider-title.constant';

import { getBankIntegrationTitle } from './get-bank-integration-title.util';

import type { MessageDescriptor } from '@lingui/core';

export const getInstitutionTitle = (
    t: (descriptor: MessageDescriptor) => string,
    provider: ExternalSourceEnum,
    label: string | null,
    groupNumber: number | null
): string => {
    if (provider === ExternalSourceEnum.MANUAL && isNotEmptyString(label)) {
        return label;
    }

    const descriptor = BANK_PROVIDER_TITLE[provider];

    return getBankIntegrationTitle(isDefined(descriptor) ? t(descriptor) : provider, label, groupNumber);
};
