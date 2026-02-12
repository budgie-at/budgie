import { isNotEmptyString } from '@rnw-community/shared';

interface ContextPartInterface {
    readonly label: string;
    readonly value: string | null | undefined;
}

export const buildContextParts = (parts: ContextPartInterface[]): string =>
    parts
        .filter(part => isNotEmptyString(part.value))
        .map(part => `${part.label}: ${part.value}`)
        .join(' | ');
