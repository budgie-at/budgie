import { isDefined } from '@rnw-community/shared';

export const convertEnumToDrizzleEnum = (value: Record<string, string>): [string, ...string[]] | undefined => {
    const [firstValue, ...remainingValues] = Object.values(value);

    if (!isDefined(firstValue)) {
        return;
    }

    return [firstValue, ...remainingValues];
};
