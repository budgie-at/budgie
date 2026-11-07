import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { SplitEntryRowSelector } from '../split-entry-row/split-entry-row.selector';

interface Props {
    readonly index: number;
    readonly categoryId: number | null;
    readonly onPress: () => void;
}

const DELETE_ICON_SIZE = 28;
const DELETE_ICON_INNER_SIZE = 14;

export const SplitEntryDeleteButton = ({ index, categoryId, onPress }: Props) => {
    const { t } = useLingui();
    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);
    const categoryTitle = category?.title;
    const accessibilityLabel = isDefined(categoryTitle) ? t`Remove ${categoryTitle} entry` : t`Remove entry`;

    return (
        <HapticPressable
            onPress={onPress}
            pressFeedback={HapticPressFeedbackEnum.DESTRUCTIVE}
            className="h-[44px] w-[44px] shrink-0 items-center justify-center"
            hitSlop={0}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            testID={SplitEntryRowSelector.Delete(index)}
        >
            <CircleIcon
                icon={UserIconNameEnum.X}
                size={DELETE_ICON_SIZE}
                iconSize={DELETE_ICON_INNER_SIZE}
                border={false}
                variant="ghost"
            />
        </HapticPressable>
    );
};
