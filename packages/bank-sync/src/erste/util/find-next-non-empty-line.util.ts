import { isNotEmptyString } from '@rnw-community/shared';

export const findNextNonEmptyLine = (lines: string[], startIndex: number): string | null => {
    for (let index = startIndex; index < lines.length; index += 1) {
        const trimmedLine = lines[index].trim();

        if (isNotEmptyString(trimmedLine)) {
            return trimmedLine;
        }
    }

    return null;
};
