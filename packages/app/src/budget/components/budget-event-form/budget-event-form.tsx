import { useLingui } from '@lingui/react/macro';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { SNAPPING_SCREEN_CHROME_CONFIG } from '../../../@generic/constant/snapping-screen-chrome-config.constant';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useBudgetEventForm } from '../../hooks/use-budget-event-form.hook';
import { BudgetDeleteRow } from '../budget-delete-row/budget-delete-row';
import { BudgetEventCategoryLimits } from '../budget-event-category-limits/budget-event-category-limits';
import { BudgetEventDatesField } from '../budget-event-dates-field/budget-event-dates-field';
import { BudgetEventSaveFooter } from '../budget-event-save-footer/budget-event-save-footer';
import { BudgetEventTagField } from '../budget-event-tag-field/budget-event-tag-field';
import { BudgetEventTagNote } from '../budget-event-tag-note/budget-event-tag-note';
import { BudgetHeroAmountField } from '../budget-hero-amount-field/budget-hero-amount-field';
import { BudgetNameField } from '../budget-name-field/budget-name-field';

interface Props {
    readonly defaultInstrumentId: number;
    readonly editingId: number | null;
}

export const BudgetEventForm = ({ defaultInstrumentId, editingId }: Props) => {
    const { t } = useLingui();
    const { form, handleCancel, handleSubmit, handleDelete, isEditing, isLoading, isSaving } = useBudgetEventForm({
        defaultInstrumentId,
        editingId
    });
    const instrumentId = useWatch({ control: form.control, name: 'instrumentId' });
    const { instrument } = useGetInstrumentByIdQuery(isPositiveNumber(instrumentId) ? instrumentId : defaultInstrumentId);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const submitLabel = isEditing ? t`Save changes` : t`Create event`;
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
                chromeConfig={SNAPPING_SCREEN_CHROME_CONFIG}
                title={headerTitle}
                leading={<GoBackButton onPress={handleCancel} />}
                footer={<BudgetEventSaveFooter submitLabel={submitLabel} isSaving={isSaving} onPress={handleSubmit} />}
            >
                <FormLayoutGroup className="gap-5xl">
                    <GroupedListSection footer={<BudgetEventTagNote />}>
                        <BudgetNameField
                            control={form.control}
                            name="name"
                            placeholder={t`e.g. Japan trip`}
                            testID={BudgetSelector.EventNameInput}
                            autoFocus={!isEditing}
                        />
                        <BudgetEventDatesField />
                        <BudgetEventTagField />
                    </GroupedListSection>
                    <BudgetHeroAmountField
                        control={form.control}
                        name="overallLimit"
                        label={t`Spending limit`}
                        currencySymbol={currencySymbol}
                        testID={BudgetSelector.EventLimitInput}
                    />
                    <BudgetEventCategoryLimits currencySymbol={currencySymbol} />
                    {deleteRow}
                </FormLayoutGroup>
            </CollapsibleChromePage>
        </FormProvider>
    );
};
