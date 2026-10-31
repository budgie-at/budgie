import { useLingui } from '@lingui/react/macro';
import * as Schema from 'effect/Schema';
import { FormProvider, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormSchema } from '../../constant/budget-event-form-schema.constant';
import { useBudgetEventForm } from '../../hooks/use-budget-event-form.hook';
import { BudgetDeleteButton } from '../budget-delete-button/budget-delete-button';
import { BudgetEventCategoryLimits } from '../budget-event-category-limits/budget-event-category-limits';
import { BudgetEventDatesField } from '../budget-event-dates-field/budget-event-dates-field';
import { BudgetEventLimitField } from '../budget-event-limit-field/budget-event-limit-field';
import { BudgetEventTagField } from '../budget-event-tag-field/budget-event-tag-field';
import { BudgetNameField } from '../budget-name-field/budget-name-field';

interface Props {
    readonly defaultInstrumentId: number;
    readonly editingId: number | null;
}

export const BudgetEventForm = ({ defaultInstrumentId, editingId }: Props) => {
    const { t } = useLingui();
    const { form, handleCancel, handleSubmit, handleDelete, isEditing, isLoading } = useBudgetEventForm({ defaultInstrumentId, editingId });
    const values = useWatch({ control: form.control });
    const instrumentId = useWatch({ control: form.control, name: 'instrumentId' });
    const { instrument } = useGetInstrumentByIdQuery(isPositiveNumber(instrumentId) ? instrumentId : defaultInstrumentId);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const isSaveDisabled = !Schema.is(BudgetEventFormSchema)({ ...form.getValues(), ...values });
    const headerTitle = isEditing ? t`Edit event` : t`New event`;

    if (isLoading) {
        return <LoadingScreen />;
    }

    const deleteButton = isEditing ? <BudgetDeleteButton testID={BudgetSelector.EventDeleteButton} onDelete={handleDelete} /> : null;

    return (
        <FormProvider {...form}>
            <CollapsibleChromePage
                title={headerTitle}
                leading={<GoBackButton onPress={handleCancel} />}
                contentClassName="gap-y-4xl"
                footer={
                    <View className="flex-row gap-x-md pt-xl px-7xl">
                        {deleteButton}
                        <ModalFormSaveButton testID={BudgetSelector.EventSaveButton} onPress={handleSubmit} disabled={isSaveDisabled} />
                    </View>
                }
            >
                <View className="gap-y-lg">
                    <BudgetNameField
                        control={form.control}
                        name="name"
                        placeholder={t`e.g. Japan trip`}
                        testID={BudgetSelector.EventNameInput}
                    />
                    <BudgetEventTagField />
                    <BudgetEventDatesField />
                    <BudgetEventLimitField currencySymbol={currencySymbol} />
                </View>
                <BudgetEventCategoryLimits currencySymbol={currencySymbol} />
            </CollapsibleChromePage>
        </FormProvider>
    );
};
