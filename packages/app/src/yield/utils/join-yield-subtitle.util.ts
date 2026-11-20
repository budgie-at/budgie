import { isNotEmptyString } from '@rnw-community/shared';

const SEGMENT_SEPARATOR = ' ·\u00A0';

export const joinYieldSubtitle = (parts: readonly (string | null)[]): string => parts.filter(isNotEmptyString).join(SEGMENT_SEPARATOR);
