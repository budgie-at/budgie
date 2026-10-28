import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { getTagsDisplayValue } from '../../utils/get-tags-display-value.util';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly variant: ColorPaletteVariant;
}

export const TransactionTagsFieldIcon = ({ variant }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openTagsSelector] = useTagsSelectorModal();
    const tagIds = useWatch({ control, name: 'tagIds' });
    const { tags } = useGetTagByIdsQuery(tagIds);

    const handlePress = () => {
        openTagsSelector({ initialTagIds: tagIds, enablePrimarySelection: true }, selectedTagIds => {
            if (isDefined(selectedTagIds)) {
                setValue('tagIds', selectedTagIds);
            }
        });
    };

    const tagsValue = getTagsDisplayValue(tags);

    return (
        <TransactionFieldIcon
            icon={UserIconNameEnum.Tag}
            label={t`Tags`}
            value={tagsValue}
            variant={variant}
            onPress={handlePress}
            animationDelay={80}
            testID={SimpleQuickFormSelector.TagsSelector}
        />
    );
};
