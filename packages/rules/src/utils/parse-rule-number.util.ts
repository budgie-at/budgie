import { isDefined, isNotEmptyString } from '@rnw-community/shared';

export const parseRuleNumber = (value: string | null): number | null => {
    if (!isDefined(value)) {
        return null;
    }

    const trimmed = value.trim();

    if (!isNotEmptyString(trimmed)) {
        return null;
    }

    const parsed = Number(trimmed);

    return Number.isFinite(parsed) ? parsed : null;
};
