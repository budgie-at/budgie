import { ExternalSourceEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

export const buildBankProviderGroupKey = (integrationId: number | null, provider: ExternalSourceEnum): string =>
    isDefined(integrationId) ? `integration:${integrationId}` : `provider:${provider}`;
