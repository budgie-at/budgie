import { useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useBudgetFundForm } from '../../hooks/use-budget-fund-form.hook';
import { resolveBudgetFundSaveBlocker } from '../../utils/resolve-budget-fund-save-blocker.util';
import { BudgetDeleteRow } from '../budget-delete-row/budget-delete-row';
import { BudgetFundCategoryField } from '../budget-fund-category-field/budget-fund-category-field';
import { BudgetFundDueField } from '../budget-fund-due-field/budget-fund-due-field';
import { BudgetFundPreview } from '../budget-fund-preview/budget-fund-preview';
import { BudgetFundRepeatField } from '../budget-fund-repeat-field/budget-fund-repeat-field';
import { BudgetFundSuggestionBanner } from '../budget-fund-suggestion-banner/budget-fund-suggestion-banner';
import { BudgetHeroAmountField } from '../budget-hero-amount-field/budget-hero-amount-field';
import { BudgetNameField } from '../budget-name-field/budget-name-field';
import { BudgetPageState } from '../budget-page-state/budget-page-state';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly editingId: number | null;
}

export const BudgetFundForm = ({ budget, editingId }: Props) => {
    const { t } = useLingui();
    const { form, editingFund, suggestion, handleUseSuggestion, handleSubmit, handleDelete, isEditing, isLoading, isSubmitting, isError } =
        useBudgetFundForm({
            budget,
            editingId
        });
    const values = form.watch();
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const saveBlocker = resolveBudgetFundSaveBlocker(values);
    const [title, submitLabel] = isEditing ? [t`Edit set aside`, t`Save changes`] : [t`New set aside`, t`Save set aside`];
    const isSaveDisabled = isLoading || isDefined(saveBlocker);
    const isFormLoading = isEditing && isLoading;
    const saveLabel = isDefined(saveBlocker) ? t(saveBlocker) : submitLabel;
    const fundedAmount = isDefined(editingFund) ? editingFund.fundedAmount : 0;

    if (isEditing && !isLoading && !isDefined(editingFund)) {
        return <BudgetPageState title={title} isLoading={false} isError={isError} />;
    }

    return (
        <FormProvider {...form}>
            <CollapsibleChromePage
                title={title}
                leading={<HeaderBackButton />}
                footer={
                    <PillButtonFooter
                        label={saveLabel}
                        accessibilityLabel={submitLabel}
                        isLoading={isSubmitting}
                        isDisabled={isSaveDisabled}
                        testID={BudgetSelector.FundSaveButton}
                        onPress={handleSubmit}
                    />
                }
            >
                <LoadingContent isLoading={isFormLoading}>
                    <FormLayoutGroup>
                        {isDefined(suggestion) ? (
                            <BudgetFundSuggestionBanner
                                suggestion={suggestion}
                                currencySymbol={currencySymbol}
                                onUse={handleUseSuggestion}
                            />
                        ) : null}
                        <BudgetHeroAmountField
                            control={form.control}
                            name="targetAmount"
                            label={t`Amount to set aside`}
                            currencySymbol={currencySymbol}
                            testID={BudgetSelector.FundTargetInput}
                        />
                        <GroupedListSection>
                            <BudgetNameField
                                control={form.control}
                                name="name"
                                placeholder={t`e.g. Car insurance`}
                                testID={BudgetSelector.FundNameInput}
                            />
                            <BudgetFundCategoryField />
                            <BudgetFundDueField />
                        </GroupedListSection>
                        <View className="gap-y-md">
                            <BudgetFundRepeatField />
                            <BudgetFundPreview budget={budget} fundedAmount={fundedAmount} currencySymbol={currencySymbol} />
                        </View>
                        {isEditing ? (
                            <BudgetDeleteRow title={t`Delete set aside`} testID={BudgetSelector.FundDeleteButton} onDelete={handleDelete} />
                        ) : null}
                    </FormLayoutGroup>
                </LoadingContent>
            </CollapsibleChromePage>
        </FormProvider>
    );
};
