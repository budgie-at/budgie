import { useLingui } from '@lingui/react/macro';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useBudgetEventForm } from '../../hooks/use-budget-event-form.hook';
import { resolveBudgetEventSaveBlocker } from '../../utils/resolve-budget-event-save-blocker.util';
import { BudgetDeleteRow } from '../budget-delete-row/budget-delete-row';
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
    const [name, tagId, startsAtMs, endsAtMs, overallLimit, categoryLimits, instrumentId] = useWatch({
        control: form.control,
        name: ['name', 'tagId', 'startsAtMs', 'endsAtMs', 'overallLimit', 'categoryLimits', 'instrumentId']
    });
    const { instrument } = useGetInstrumentByIdQuery(isPositiveNumber(instrumentId) ? instrumentId : defaultInstrumentId);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const saveBlocker = resolveBudgetEventSaveBlocker({
        name,
        tagId,
        startsAtMs,
        endsAtMs,
        overallLimit,
        categoryLimits,
        instrumentId
    });
    const submitLabel = isEditing ? t`Save changes` : t`Create event`;
    const saveLabel = isDefined(saveBlocker) ? t(saveBlocker) : submitLabel;
    const headerTitle = isEditing ? t`Edit event` : t`New event`;

    if (isLoading) {
        return <LoadingScreen />;
    }

    const deleteRow = isEditing ? (
        <BudgetDeleteRow title={t`Delete event`} testID={BudgetSelector.EventDeleteButton} onDelete={handleDelete} />
    ) : null;

    return (
        <FormProvider {...form}>
            <CollapsibleChromePage
                title={headerTitle}
                leading={<GoBackButton onPress={handleCancel} />}
                footer={
                    <PillButtonFooter
                        label={saveLabel}
                        isDisabled={isDefined(saveBlocker)}
                        testID={BudgetSelector.EventSaveButton}
                        onPress={handleSubmit}
                    />
                }
            >
                <FormLayoutGroup>
                    <BudgetEventLimitField currencySymbol={currencySymbol} />
                    <GroupedListSection title={t`Details`} footer={t`Tagged expenses also count in your main budget.`}>
                        <BudgetNameField
                            control={form.control}
                            name="name"
                            placeholder={t`e.g. Japan trip`}
                            testID={BudgetSelector.EventNameInput}
                        />
                        <BudgetEventTagField />
                        <BudgetEventDatesField />
                    </GroupedListSection>
                    <BudgetEventCategoryLimits currencySymbol={currencySymbol} />
                    {deleteRow}
                </FormLayoutGroup>
            </CollapsibleChromePage>
        </FormProvider>
    );
};
