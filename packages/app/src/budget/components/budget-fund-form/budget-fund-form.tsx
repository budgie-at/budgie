import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Schema from 'effect/Schema';
import { FormProvider, useWatch } from 'react-hook-form';
import { ScrollView, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFundFormSchema } from '../../constant/budget-fund-form-schema.constant';
import { useBudgetFundForm } from '../../hooks/use-budget-fund-form.hook';
import { BudgetFundCategoryField } from '../budget-fund-category-field/budget-fund-category-field';
import { BudgetFundDueField } from '../budget-fund-due-field/budget-fund-due-field';
import { BudgetFundPreview } from '../budget-fund-preview/budget-fund-preview';
import { BudgetFundRepeatField } from '../budget-fund-repeat-field/budget-fund-repeat-field';
import { BudgetFundSuggestionBanner } from '../budget-fund-suggestion-banner/budget-fund-suggestion-banner';
import { BudgetFundTargetField } from '../budget-fund-target-field/budget-fund-target-field';
import { BudgetNameField } from '../budget-name-field/budget-name-field';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly editingId: number | null;
}

export const BudgetFundForm = ({ budget, editingId }: Props) => {
    const { t } = useLingui();
    const { form, editingFund, suggestion, handleUseSuggestion, handleSubmit, handleDelete, isEditing } = useBudgetFundForm({
        budget,
        editingId
    });
    const values = useWatch({ control: form.control });
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const isSaveDisabled = !Schema.is(BudgetFundFormSchema)({ ...form.getValues(), ...values });
    const fundedAmount = isDefined(editingFund) ? editingFund.fundedAmount : 0;
    const suggestionBanner = isDefined(suggestion) ? (
        <BudgetFundSuggestionBanner suggestion={suggestion} currencySymbol={currencySymbol} onUse={handleUseSuggestion} />
    ) : null;
    const deleteButton = isEditing ? (
        <Button testID={BudgetSelector.FundDeleteButton} variant="destructive" leftIcon={UserIconNameEnum.Trash2} onPress={handleDelete} />
    ) : null;

    return (
        <FormProvider {...form}>
            <View className="flex-1 border-t-hairline border-secondary-corner bg-primary-reverse dark:bg-secondary-background">
                <FormsheetHeader size="md" title={t`Set aside for`} />
                <ScrollView
                    contentContainerClassName="px-5xl pt-md gap-y-xl pb-5xl"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {suggestionBanner}
                    <BudgetNameField
                        control={form.control}
                        name="name"
                        placeholder={t`e.g. Car insurance`}
                        testID={BudgetSelector.FundNameInput}
                    />
                    <BudgetFundCategoryField />
                    <BudgetFundTargetField currencySymbol={currencySymbol} />
                    <BudgetFundDueField />
                    <BudgetFundRepeatField />
                    <BudgetFundPreview budget={budget} fundedAmount={fundedAmount} currencySymbol={currencySymbol} />
                    <View className="flex-row gap-x-md">
                        {deleteButton}
                        <ModalFormSaveButton testID={BudgetSelector.FundSaveButton} onPress={handleSubmit} disabled={isSaveDisabled} />
                    </View>
                </ScrollView>
            </View>
        </FormProvider>
    );
};
