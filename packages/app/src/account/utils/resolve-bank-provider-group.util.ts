import { isDefined } from '@rnw-community/shared';

import type { ExternalSourceEnum } from '@budgie/contracts';

export const resolveBankProviderGroup = (
    integrationId: number | null,
    integrationProviders: ReadonlyMap<number, ExternalSourceEnum>
): { integrationId: number; provider: ExternalSourceEnum } | null => {
    if (!isDefined(integrationId)) {
        return null;
    }

    const provider = integrationProviders.get(integrationId);

    return isDefined(provider) ? { integrationId, provider } : null;
};
