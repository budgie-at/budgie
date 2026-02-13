import { TransactionCreateInputInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useImperativeHandle, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import {
    CATEGORY_ANIMATION_DELAY,
    DATE_ANIMATION_DELAY,
    NOTE_ANIMATION_DELAY,
    SPLIT_ANIMATION_DELAY,
    TAGS_ANIMATION_DELAY
} from '../../constant/transaction-field-animation-delay.constant';
import { formatOperatedAt } from '../../utils/format-operated-at.util';
import { getTagsDisplayValue } from '../../utils/get-tags-display-value.util';
import { TransactionFieldIcon, TransactionFieldIconRef } from '../transaction-field-icon/transaction-field-icon';

export interface TransactionFieldIconsRef {
    shakeCategory: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionFieldIconsRef | null>;
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly splitEntryCount?: number;
    readonly isAmountPositive?: boolean;
    readonly onCommentPress: () => void;
    readonly onDatePress: () => void;
    readonly onSplitPress?: () => void;
    readonly categorySelectorTestID?: string;
}

// eslint-disable-next-line max-statements, max-lines-per-function -- Form orchestration component with multiple hooks and handlers
export const TransactionFieldIcons = (props: Props) => {
    const {
        ref,
        variant,
        transactionType,
        splitEntryCount = 0,
        isAmountPositive = false,
        onCommentPress,
        onDatePress,
        onSplitPress,
        categorySelectorTestID
    } = props;
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openCategorySelector] = useCategorySelectorModal();
    const [openTagsSelector] = useTagsSelectorModal();

    const categoryIconRef = useRef<TransactionFieldIconRef>(null);

    useImperativeHandle(ref, () => ({
        shakeCategory: () => categoryIconRef.current?.shake()
    }));

    const categoryId = useWatch({ control, name: 'entries.0.categoryId' });
    const tagIds = useWatch({ control, name: 'tagIds' });
    const operatedAt = useWatch({ control, name: 'operatedAt' });
    const comment = useWatch({ control, name: 'comment' });

    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);
    const { tags } = useGetTagByIdsQuery(tagIds);

    const handleCategoryPress = async () => {
        const selectedCategoryId = await openCategorySelector({ initialCategoryId: categoryId, variant });

        if (isDefined(selectedCategoryId)) {
            setValue('entries.0.categoryId', selectedCategoryId);
        }
    };

    const handleTagsPress = async () => {
        const selectedTagIds = await openTagsSelector({ initialTagIds: tagIds });

        if (isDefined(selectedTagIds)) {
            setValue('tagIds', selectedTagIds);
        }
    };

    const isTransfer = transactionType === TransactionTypeEnum.TRANSFER;
    const isSplitActive = splitEntryCount > 1;
    const formattedDate = formatOperatedAt({
        date: operatedAt,
        today: t`Today`,
        yesterday: t`Yesterday`,
        formatDate: intl.formatDate
    });
    const tagsValue = getTagsDisplayValue(tags);
    const noteValue = isNotEmptyString(comment) ? comment : void 0;

    const showSplitIcon = isDefined(onSplitPress);
    const splitValue = isSplitActive ? t`${splitEntryCount} items` : void 0;
    const splitEnabled = isAmountPositive || isSplitActive;

    const splitOpacityStyle = useAnimatedStyle(() => ({
        opacity: withTiming(splitEnabled ? 1 : 0.3, { duration: 200 })
    }));

    const splitPointerEvents = splitEnabled ? 'auto' : 'none';

    return (
        <View className="flex-row py-lg">
            {showSplitIcon ? (
                <Animated.View style={splitOpacityStyle} pointerEvents={splitPointerEvents} className="flex-1">
                    <TransactionFieldIcon
                        icon={UserIconNameEnum.Split}
                        label={t`Split`}
                        value={splitValue}
                        variant={variant}
                        onPress={onSplitPress}
                        animationDelay={SPLIT_ANIMATION_DELAY}
                    />
                </Animated.View>
            ) : null}

            <TransactionFieldIcon
                icon={UserIconNameEnum.Calendar}
                label={t`Date`}
                value={formattedDate}
                variant={variant}
                onPress={onDatePress}
                animationDelay={DATE_ANIMATION_DELAY}
            />

            <TransactionFieldIcon
                icon={UserIconNameEnum.MessageSquare}
                label={t`Note`}
                value={noteValue}
                variant={variant}
                onPress={onCommentPress}
                animationDelay={NOTE_ANIMATION_DELAY}
            />

            {isTransfer ? null : (
                <TransactionFieldIcon
                    icon={UserIconNameEnum.Tag}
                    label={t`Tags`}
                    value={tagsValue}
                    variant={variant}
                    onPress={handleTagsPress}
                    animationDelay={TAGS_ANIMATION_DELAY}
                />
            )}

            {isTransfer ? null : (
                <TransactionFieldIcon
                    ref={categoryIconRef}
                    testID={categorySelectorTestID}
                    icon={category?.icon ?? UserIconNameEnum.Folder}
                    label={t`Category`}
                    value={category?.title}
                    variant={variant}
                    disabled={isSplitActive}
                    onPress={handleCategoryPress}
                    animationDelay={CATEGORY_ANIMATION_DELAY}
                />
            )}
        </View>
    );
};
