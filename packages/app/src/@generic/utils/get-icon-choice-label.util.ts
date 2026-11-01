import { isEmojiIcon } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { UserIconType } from '@budgie/contracts';
import type { useLingui } from '@lingui/react/macro';

export const getIconChoiceLabel = (icon: UserIconType, label: string, t: ReturnType<typeof useLingui>['t']) =>
    isEmojiIcon(icon) ? t(msg`Use ${label} emoji`) : t(msg`Use ${label} icon`);
