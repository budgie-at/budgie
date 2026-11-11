import { isDefined } from '@rnw-community/shared';

import { BANK_PROVIDER_TITLE } from '../constant/bank-provider-title.constant';

import type { ExternalSourceEnum } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

export const getBankProviderTitle = (t: (descriptor: MessageDescriptor) => string, provider: ExternalSourceEnum): string => {
    const descriptor = BANK_PROVIDER_TITLE[provider];

    return isDefined(descriptor) ? t(descriptor) : provider;
};
