import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { useWindowDimensions, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { useTransactionDateLabel } from '../../hook/use-transaction-date-label.hook';
import { getTagsDisplayValue } from '../../utils/get-tags-display-value.util';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionMetadataField } from '../transaction-metadata-field/transaction-metadata-field';

const PAIRED_FIELDS_MIN_WIDTH = 390;

interface Props {
    readonly onDatePress: () => void;
}

export const TransactionDateTagsRow = ({ onDatePress }: Props) => {
    const { t } = useLingui();
    const { fontScale, width } = useWindowDimensions();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openTagsSelector] = useTagsSelectorModal();
    const tagIds = useWatch({ control, name: 'tagIds' });
    const { tags } = useGetTagByIdsQuery(tagIds);
    const dateLabel = useTransactionDateLabel();
    const usesStackedLayout = fontScale > 1 || width < PAIRED_FIELDS_MIN_WIDTH;
    const containerClassName = usesStackedLayout ? 'bg-grouped-surface-row' : 'flex-row items-stretch bg-grouped-surface-row';
    const separatorClassName = usesStackedLayout ? 'h-hairline bg-surface-separator' : 'w-hairline bg-surface-separator';
    const tagsValue = getTagsDisplayValue(tags);
    const tagsAccessibilityValue = isNotEmptyArray(tags) ? tags.map(tag => tag.title).join(', ') : void 0;

    const handleTagsPress = () => {
        openTagsSelector({ initialTagIds: tagIds, enablePrimarySelection: true }, selectedTagIds => {
            if (isDefined(selectedTagIds)) {
                setValue('tagIds', selectedTagIds);
            }
        });
    };

    return (
        <View className={containerClassName}>
            <TransactionMetadataField
                icon={UserIconNameEnum.Calendar}
                label={t`Date`}
                value={dateLabel}
                onPress={onDatePress}
                testID={SimpleQuickFormSelector.DatePicker}
            />
            <View className={separatorClassName} pointerEvents="none" />
            <TransactionMetadataField
                icon={UserIconNameEnum.Tag}
                label={t`Tags`}
                value={tagsValue}
                accessibilityValue={tagsAccessibilityValue}
                onPress={handleTagsPress}
                testID={SimpleQuickFormSelector.TagsSelector}
            />
        </View>
    );
};
