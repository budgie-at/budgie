import { isNotEmptyString } from '@rnw-community/shared';

export const joinWithMiddot = (segments: readonly (string | null | undefined)[]) => segments.filter(isNotEmptyString).join(' · ');
