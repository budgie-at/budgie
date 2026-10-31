import { isEmojiIcon } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DestinationRow } from '../../../@generic/component/destination-row/destination-row';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { useIconSearchEntries } from '../../../@generic/hook/use-icon-search-entries.hook';
import { CategorySelectorModalSelector } from '../../../app/category-selector-modal.selector';
import { getCategoryDisplayIcon } from '../../utils/get-category-display-icon.util';

import type { CategoryEntityInterface } from '@budgie/contracts';

interface Props {
    readonly category: CategoryEntityInterface;
    readonly subtitle: string | null;
    readonly isSelected: boolean;
    readonly isDisabled: boolean;
    readonly onSelect: (id: number) => void;
}

export const CategoryDestinationRow = ({ category, subtitle, isSelected, isDisabled, onSelect }: Props) => {
    const iconSearchEntries = useIconSearchEntries();
    const icon = getCategoryDisplayIcon(category, iconSearchEntries);
    const iconSize = isEmojiIcon(icon) ? 22 : 18;

    return (
        <DestinationRow
            id={category.id}
            title={category.title}
            subtitle={subtitle}
            left={
                <CircleIcon
                    icon={icon}
                    variant="secondary"
                    size={36}
                    iconSize={iconSize}
                    radius={18}
                    border={false}
                    className={TONAL_DISC_BACKGROUND.secondary}
                />
            }
            isSelected={isSelected}
            isDisabled={isDisabled}
            onSelect={onSelect}
            testID={CategorySelectorModalSelector.Card(category.title)}
        />
    );
};
