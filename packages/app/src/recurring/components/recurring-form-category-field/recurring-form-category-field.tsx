import { RecurringSeriesKindEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

export const RecurringFormCategoryField = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<RecurringSeriesFormValues>();
    const [categoryId, kind] = useWatch({ control, name: ['categoryId', 'kind'] });
    const openCategorySelector = useOpenModal('/category-selector');
    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);
    const variant = kind === RecurringSeriesKindEnum.INCOME ? 'positive' : 'destructive';
    const hasCategory = isDefined(categoryId);

    const handlePress = () => {
        openCategorySelector({ initialCategoryId: categoryId, variant }, selectedCategoryId => {
            if (isDefined(selectedCategoryId)) {
                setValue('categoryId', selectedCategoryId);
            }
        });
    };

    const handleClear = () => {
        setValue('categoryId', null);
    };

    return (
        <GroupedListValueRow
            icon={category?.icon ?? UserIconNameEnum.Folder}
            title={t`Category`}
            value={category?.title ?? t`None`}
            testID={RecurringSeriesFormSelector.Category}
            onPress={handlePress}
            {...(hasCategory && { onClear: handleClear })}
        />
    );
};
