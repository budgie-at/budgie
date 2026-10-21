import { isDefined, isNotEmptyString } from '@rnw-community/shared';

export const getBankIntegrationTitle = (providerTitle: string, label: string | null, groupNumber: number | null): string => {
    if (isNotEmptyString(label)) {
        return `${providerTitle} · ${label}`;
    }

    return isDefined(groupNumber) ? `${providerTitle} ${groupNumber}` : providerTitle;
};
