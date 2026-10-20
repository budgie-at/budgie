import { msg } from '@lingui/core/macro';

import { PillarEnum } from './pillar.enum';

import type { MessageDescriptor } from '@lingui/core';

export const PILLAR_LABEL: Record<PillarEnum, MessageDescriptor> = {
    [PillarEnum.BANK]: msg`Bank sync`,
    [PillarEnum.AI]: msg`On-device AI`,
    [PillarEnum.PRIVACY]: msg`Privacy`,
    [PillarEnum.PLANNING]: msg`Planning`
};
