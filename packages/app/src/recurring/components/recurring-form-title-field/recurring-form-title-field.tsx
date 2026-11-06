import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { FormTitleInput } from '../../../@generic/component/form-title-input/form-title-input';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { RECURRING_TITLE_MAX_LENGTH } from '../../constant/recurring-title-max-length.constant';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

export const RecurringFormTitleField = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RecurringSeriesFormValues>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'title' });

    return (
        <GroupedListSection title={t`Name`}>
            <View className="min-h-[56px] justify-center px-3xl py-lg">
                <FormTitleInput
                    autoFocus={false}
                    editable
                    value={value}
                    onChangeText={onChange}
                    maxLength={RECURRING_TITLE_MAX_LENGTH}
                    placeholder={t`e.g. Netflix, Rent`}
                    accessibilityLabel={t`Recurring payment name`}
                    testID={RecurringSeriesFormSelector.Title}
                />
            </View>
        </GroupedListSection>
    );
};
