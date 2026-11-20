import { isNotEmptyString } from '@rnw-community/shared';

export const joinYieldSubtitle = (parts: readonly (string | null)[]): string => parts.filter(isNotEmptyString).join(' · ');
