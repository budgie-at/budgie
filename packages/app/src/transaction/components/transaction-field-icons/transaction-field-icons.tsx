import { TransactionCreateInputInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useImperativeHandle, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import {
    CATEGORY_ANIMATION_DELAY,
    CONSOLIDATION_ANIMATION_DELAY,
    DATE_ANIMATION_DELAY,
    NOTE_ANIMATION_DELAY,
    SPLIT_ANIMATION_DELAY,
    TAGS_ANIMATION_DELAY
} from '../../constant/transaction-field-animation-delay.constant';
import { formatOperatedAt } from '../../utils/format-operated-at.util';
import { getTagsDisplayValue } from '../../utils/get-tags-display-value.util';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { TransactionFieldIcon, TransactionFieldIconRef } from '../transaction-field-icon/transaction-field-icon';

import { TransactionFieldIconsSelector } from './transaction-field-icons.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { TransactionFieldIconsRefInterface } from '../../interface/transaction-field-icons-ref.interface';
import type { EmptyFn } from '@rnw-community/shared';
import type { RefObject } from 'react';

interface Props {
    readonly ref?: RefObject<TransactionFieldIconsRefInterface | null>;
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly splitEntryCount?: number;
    readonly isAmountPositive?: boolean;
    readonly onCommentPress: EmptyFn;
    readonly onDatePress: EmptyFn;
    readonly onConsolidationPress?: EmptyFn;
    readonly onSplitPress?: EmptyFn;
    readonly categoryTestID?: string;
    readonly tagsTestID?: string;
    readonly commentTestID?: string;
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
        onConsolidationPress,
        onSplitPress,
        categoryTestID,
        tagsTestID,
        commentTestID
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

    const entries = useWatch({ control, name: 'entries' });
    const tagIds = useWatch({ control, name: 'tagIds' });
    const operatedAt = useWatch({ control, name: 'operatedAt' });
    const comment = useWatch({ control, name: 'comment' });

    const categoryEntries = getTransactionCategoryEntries(entries);
    const categoryId = categoryEntries.at(0)?.categoryId ?? null;
    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);
    const { tags } = useGetTagByIdsQuery(tagIds);

    const handleCategoryPress = async () => {
        const selectedCategoryId = await openCategorySelector({ initialCategoryId: categoryId, variant });

        if (isDefined(selectedCategoryId)) {
            const updatedEntries = entries.map(entry =>
                entry === categoryEntries.at(0) ? { ...entry, categoryId: selectedCategoryId } : entry
            );

            setValue('entries', updatedEntries, { shouldValidate: false });
        }
    };

    const handleTagsPress = async () => {
        const selectedTagIds = await openTagsSelector({ initialTagIds: tagIds, enablePrimarySelection: true });

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
    const showConsolidationIcon = isDefined(onConsolidationPress);
    const splitValue = isSplitActive
        ? t({
              message: plural(splitEntryCount, {
                  one: '# item',
                  other: '# items'
              })
          })
        : void 0;
    const splitEnabled = isAmountPositive || isSplitActive;
    const categoryIcon = category?.icon ?? UserIconNameEnum.Folder;

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
                        testID={TransactionFieldIconsSelector.Split}
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
                testID={commentTestID}
            />

            {showConsolidationIcon ? (
                <TransactionFieldIcon
                    icon={UserIconNameEnum.GitMerge}
                    label={t`Sources`}
                    variant={variant}
                    onPress={onConsolidationPress}
                    animationDelay={CONSOLIDATION_ANIMATION_DELAY}
                    testID={TransactionFieldIconsSelector.Sources}
                />
            ) : null}

            {isTransfer ? null : (
                <TransactionFieldIcon
                    icon={UserIconNameEnum.Tag}
                    label={t`Tags`}
                    value={tagsValue}
                    variant={variant}
                    onPress={handleTagsPress}
                    animationDelay={TAGS_ANIMATION_DELAY}
                    testID={tagsTestID}
                />
            )}

            {isTransfer ? null : (
                <TransactionFieldIcon
                    ref={categoryIconRef}
                    icon={categoryIcon}
                    label={t`Category`}
                    value={category?.title}
                    variant={variant}
                    disabled={isSplitActive}
                    onPress={handleCategoryPress}
                    animationDelay={CATEGORY_ANIMATION_DELAY}
                    testID={categoryTestID}
                />
            )}
        </View>
    );
};
