import { TransactionCreateInputInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { format, isToday, isYesterday } from 'date-fns';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import {
    CATEGORY_ANIMATION_DELAY,
    DATE_ANIMATION_DELAY,
    NOTE_ANIMATION_DELAY,
    TAGS_ANIMATION_DELAY
} from '../../constant/transaction-field-animation-delay.constant';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly onCommentPress: () => void;
    readonly onDatePress: () => void;
}

const formatOperatedAt = (date: Date, today: string, yesterday: string): string => {
    if (isToday(date)) {
        return today;
    }

    if (isYesterday(date)) {
        return yesterday;
    }

    return format(date, 'MMM d');
};

const getTagsDisplayValue = (tags: { title: string }[] | null): string | undefined => {
    if (!isNotEmptyArray(tags)) {
        return void 0;
    }

    if (tags.length === 1) {
        return tags[0].title;
    }

    return `${tags[0].title} +${tags.length - 1}`;
};

// eslint-disable-next-line max-statements -- Component requires orchestrating multiple form fields and handlers
export const TransactionFieldIcons = (props: Props) => {
    const { variant, transactionType, onCommentPress, onDatePress } = props;
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const { openCategorySelector } = useCategorySelectorModal();
    const { openTagsSelector } = useTagsSelectorModal();

    const categoryId = useWatch({ control, name: 'entries.0.categoryId' });
    const tagIds = useWatch({ control, name: 'tagIds' });
    const operatedAt = useWatch({ control, name: 'operatedAt' });
    const comment = useWatch({ control, name: 'comment' });

    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);
    const { tags } = useGetTagByIdsQuery(tagIds);

    const handleCategoryPress = async () => {
        const selectedCategoryId = await openCategorySelector({ initialCategoryId: categoryId, variant });

        if (selectedCategoryId !== null) {
            setValue('entries.0.categoryId', selectedCategoryId);
        }
    };

    const handleTagsPress = async () => {
        const selectedTagIds = await openTagsSelector({ initialTagIds: tagIds });

        if (selectedTagIds !== null) {
            setValue('tagIds', selectedTagIds);
        }
    };

    const isTransfer = transactionType === TransactionTypeEnum.TRANSFER;
    const formattedDate = formatOperatedAt(operatedAt, t`Today`, t`Yesterday`);
    const tagsValue = getTagsDisplayValue(tags);
    const noteValue = isNotEmptyString(comment) ? comment : void 0;
    const dateAnimationDelay = isTransfer ? CATEGORY_ANIMATION_DELAY : DATE_ANIMATION_DELAY;
    const noteAnimationDelay = isTransfer ? TAGS_ANIMATION_DELAY : NOTE_ANIMATION_DELAY;

    return (
        <View className="flex-row px-xl py-lg">
            {isTransfer ? null : (
                <TransactionFieldIcon
                    icon={category?.icon ?? UserIconNameEnum.Folder}
                    label={t`Category`}
                    value={category?.title}
                    variant={variant}
                    onPress={handleCategoryPress}
                    animationDelay={CATEGORY_ANIMATION_DELAY}
                />
            )}

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

            <TransactionFieldIcon
                icon={UserIconNameEnum.Calendar}
                label={t`Date`}
                value={formattedDate}
                variant={variant}
                onPress={onDatePress}
                animationDelay={dateAnimationDelay}
            />

            <TransactionFieldIcon
                icon={UserIconNameEnum.MessageSquare}
                label={t`Note`}
                value={noteValue}
                variant={variant}
                onPress={onCommentPress}
                animationDelay={noteAnimationDelay}
            />
        </View>
    );
};
