import { BudgetLimitSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetTemplateKindEnum } from '../../enum/budget-template-kind.enum';
import { useBudgetForm } from '../../hooks/use-budget-form.hook';
import { resolveBudgetSaveBlocker } from '../../utils/resolve-budget-save-blocker.util';
import { BudgetAutoTuneField } from '../budget-auto-tune-field/budget-auto-tune-field';
import { BudgetDeleteRow } from '../budget-delete-row/budget-delete-row';
import { BudgetInlineCategoryLimits } from '../budget-inline-category-limits/budget-inline-category-limits';
import { BudgetLimitSourceField } from '../budget-limit-source-field/budget-limit-source-field';
import { BudgetNameField } from '../budget-name-field/budget-name-field';
import { BudgetPageState } from '../budget-page-state/budget-page-state';
import { BudgetPeriodField } from '../budget-period-field/budget-period-field';
import { BudgetSetupProgressContent } from '../budget-setup-progress-content/budget-setup-progress-content';
import { BudgetSetupProgress } from '../budget-setup-progress/budget-setup-progress';
import { BudgetStartsOnField } from '../budget-starts-on-field/budget-starts-on-field';

import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

interface Props {
    readonly defaultInstrumentId: number;
    readonly editingId: number | null;
    readonly templateKind: BudgetTemplateKindEnum | null;
}

export const BudgetSetupForm = ({ defaultInstrumentId, editingId, templateKind }: Props) => {
    const { t } = useLingui();
    const scrollViewRef = useRef<KeyboardAwareScrollViewRef | null>(null);
    const budgetForm = useBudgetForm({ defaultInstrumentId, editingId, templateKind });
    const { form, isEditing, isLoading, isError, isSubmitting, isUnavailable, budget } = budgetForm;
    const { instrumentId, saveBlocker: watchedSaveBlocker } = useWatch({
        control: form.control,
        compute: values => {
            const resolvedInstrumentId = isPositiveNumber(values.instrumentId) ? values.instrumentId : defaultInstrumentId;

            return {
                instrumentId: resolvedInstrumentId,
                saveBlocker: resolveBudgetSaveBlocker({ ...values, instrumentId: resolvedInstrumentId })
            };
        }
    });
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const saveBlocker = isLoading ? null : watchedSaveBlocker;
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const handleCategoryAdded = () => scrollViewRef.current?.scrollToEnd({ animated: true });
    const scrollViewProps = { ref: scrollViewRef };
    const [headerTitle, submitLabel] = isEditing ? [t`Edit budget`, t`Save changes`] : [t`Create budget`, t`Create budget`];
    const isSaveDisabled = isLoading || isDefined(saveBlocker);
    const saveLabel = isDefined(saveBlocker) ? t(saveBlocker) : submitLabel;
    const hasProgress = isEditing && (!isDefined(budget) || budget.limitSource === BudgetLimitSourceEnum.FIXED);

    return isUnavailable ? (
        <BudgetPageState title={headerTitle} isLoading={false} isError={isError} />
    ) : (
        <FormProvider {...form}>
            <CollapsibleChromePage
                title={headerTitle}
                leading={<GoBackButton onPress={budgetForm.handleCancel} />}
                contentClassName="gap-y-7xl"
                scrollViewProps={scrollViewProps}
                footer={
                    <PillButtonFooter
                        label={saveLabel}
                        accessibilityLabel={submitLabel}
                        isLoading={isSubmitting}
                        isDisabled={isSaveDisabled}
                        testID={BudgetSelector.SetupSaveButton}
                        onPress={budgetForm.handleSubmit}
                    />
                }
            >
                <LoadingContent isLoading={isLoading} className="gap-y-7xl">
                    {hasProgress ? (
                        <View collapsable={false}>
                            {isDefined(budget) ? (
                                <BudgetSetupProgress budget={budget} currencySymbol={currencySymbol} />
                            ) : (
                                <BudgetSetupProgressContent scope={null} currencySymbol={currencySymbol} />
                            )}
                        </View>
                    ) : null}
                    <GroupedListSection title={t`Details`}>
                        <BudgetNameField
                            control={form.control}
                            name="name"
                            placeholder={t`Budget name`}
                            testID={BudgetSelector.SetupNameInput}
                        />
                    </GroupedListSection>
                    <GroupedListSection title={t`Period`}>
                        <BudgetPeriodField onPeriodChange={budgetForm.handlePeriodChange} />
                        <BudgetStartsOnField />
                    </GroupedListSection>
                    <BudgetLimitSourceField currencySymbol={currencySymbol} />
                    <BudgetAutoTuneField />
                    <BudgetInlineCategoryLimits currencySymbol={currencySymbol} onCategoryAdded={handleCategoryAdded} />
                    {isEditing ? (
                        <BudgetDeleteRow
                            title={t`Delete budget`}
                            testID={BudgetSelector.SetupDeleteButton}
                            onDelete={budgetForm.handleDelete}
                        />
                    ) : null}
                </LoadingContent>
            </CollapsibleChromePage>
        </FormProvider>
    );
};
