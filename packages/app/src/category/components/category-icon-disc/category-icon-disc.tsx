import { CategoryEntityInterface, isEmojiIcon } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { getCategoryDisplayIcon } from '../../utils/get-category-display-icon.util';

interface Props {
    readonly category: Pick<CategoryEntityInterface, 'icon' | 'iconSource' | 'isDefault'>;
}

export const CategoryIconDisc = ({ category }: Props) => {
    const icon = getCategoryDisplayIcon(category);
    const iconSize = isEmojiIcon(icon) ? 22 : 18;

    return (
        <CircleIcon
            icon={icon}
            variant="secondary"
            size={36}
            iconSize={iconSize}
            radius={18}
            border={false}
            className={TONAL_DISC_BACKGROUND.secondary}
        />
    );
};
