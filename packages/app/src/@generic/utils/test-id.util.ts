import { isNotEmptyArray, isNotEmptyString, isNumber } from '@rnw-community/shared';

export const testID = (...parts: readonly (string | number | null | undefined | false)[]): { readonly testID?: string } => {
    const [rootPart] = parts;

    if (!isNumber(rootPart) && !isNotEmptyString(rootPart)) {
        return {};
    }

    const testIDParts: string[] = [];

    for (const part of parts) {
        if (isNumber(part)) {
            testIDParts.push(String(part));
        } else if (isNotEmptyString(part)) {
            testIDParts.push(part);
        }
    }

    if (isNotEmptyArray(testIDParts)) {
        return { testID: testIDParts.join('.') };
    }

    return {};
};
