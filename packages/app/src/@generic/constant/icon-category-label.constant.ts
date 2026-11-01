import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { IconCategoryEnum } from '../enum/icon-category.enum';

export const ICON_CATEGORY_LABEL: Record<IconCategoryEnum, MessageDescriptor> = {
    [IconCategoryEnum.MONEY]: msg`Money`,
    [IconCategoryEnum.SHOPPING]: msg`Shopping`,
    [IconCategoryEnum.FOOD]: msg`Food & drink`,
    [IconCategoryEnum.HOME]: msg`Home`,
    [IconCategoryEnum.TRANSPORT]: msg`Transport`,
    [IconCategoryEnum.TRAVEL]: msg`Travel`,
    [IconCategoryEnum.HEALTH]: msg`Health`,
    [IconCategoryEnum.ENTERTAINMENT]: msg`Entertainment`,
    [IconCategoryEnum.EDUCATION]: msg`Education`,
    [IconCategoryEnum.GIFTS]: msg`Gifts`,
    [IconCategoryEnum.WORK]: msg`Work`,
    [IconCategoryEnum.EMOJI_SMILEYS]: msg`Smileys & people`,
    [IconCategoryEnum.EMOJI_ANIMALS]: msg`Animals & nature`,
    [IconCategoryEnum.EMOJI_FOOD]: msg`Food & drink`,
    [IconCategoryEnum.EMOJI_TRAVEL]: msg`Travel & places`,
    [IconCategoryEnum.EMOJI_ACTIVITIES]: msg`Activities`,
    [IconCategoryEnum.EMOJI_OBJECTS]: msg`Objects`,
    [IconCategoryEnum.EMOJI_SYMBOLS]: msg`Symbols`,
    [IconCategoryEnum.EMOJI_FLAGS]: msg`Flags`
};
