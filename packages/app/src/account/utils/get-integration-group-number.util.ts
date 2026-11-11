import { isDefined } from '@rnw-community/shared';

import type { BankIntegrationEntityInterface } from '@budgie/contracts';

export const getIntegrationGroupNumber = (
    integrations: readonly Pick<BankIntegrationEntityInterface, 'id' | 'provider' | 'label'>[],
    integration: Pick<BankIntegrationEntityInterface, 'id' | 'provider' | 'label'>
): number | null => {
    if (isDefined(integration.label)) {
        return null;
    }

    const unlabeledIds = integrations
        .filter(other => other.provider === integration.provider && !isDefined(other.label))
        .map(other => other.id)
        .sort((left, right) => left - right);

    return unlabeledIds.length > 1 ? unlabeledIds.indexOf(integration.id) + 1 : null;
};
