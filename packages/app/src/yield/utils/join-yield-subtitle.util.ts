import { isNotEmptyString } from '@rnw-community/shared';

import { YIELD_SUBTITLE_SEPARATOR } from '../constant/yield-subtitle-separator.constant';

export const joinYieldSubtitle = (parts: readonly (string | null)[]): string =>
    parts.filter(isNotEmptyString).join(YIELD_SUBTITLE_SEPARATOR);
