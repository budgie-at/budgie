import { t } from '@lingui/core/macro';
import { useRef } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormSchema } from '../../constant/budget-form-schema.constant';
import { BudgetTemplateKindEnum } from '../../enum/budget-template-kind.enum';
import { useBudgetForm } from '../../hooks/use-budget-form.hook';
import { useGetBudgetSpentQuery } from '../../query/use-get-budget-spent.query';
import { BudgetEditFooter } from '../budget-edit-footer/budget-edit-footer';
import { BudgetInlineCategoryLimits } from '../budget-inline-category-limits/budget-inline-category-limits';
import { BudgetOverallLimitField } from '../budget-overall-limit-field/budget-overall-limit-field';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';
import { BudgetSetupDeleteButton } from '../budget-setup-delete-button/budget-setup-delete-button';

import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

interface Props {
    readonly defaultInstrumentId: number;
    readonly editingId: number | null;
    readonly templateKind: BudgetTemplateKindEnum | null;
}

export const BudgetSetupForm = ({ defaultInstrumentId, editingId, templateKind }: Props) => {
    const scrollViewRef = useRef<KeyboardAwareScrollViewRef | null>(null);
    const { form, handleCancel, handleSubmit, handleDelete, isEditing, isLoading, budget } = useBudgetForm({
        defaultInstrumentId,
        editingId,
        templateKind
    });
    const [overallLimit, otherLimit, categoryLimits, watchedInstrumentId] = useWatch({
        control: form.control,
        name: ['overallLimit', 'otherLimit', 'categoryLimits', 'instrumentId']
    });
    const { spent } = useGetBudgetSpentQuery(budget);
    const instrumentId = isPositiveNumber(watchedInstrumentId) ? watchedInstrumentId : defaultInstrumentId;
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const isSaveDisabled = !BudgetFormSchema.safeParse({ ...form.getValues(), overallLimit, otherLimit, categoryLimits, instrumentId })
        .success;
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const headerTitle = isEditing ? t`Edit budget` : t`Create budget`;
    const handleCategoryAdded = () => scrollViewRef.current?.scrollToEnd({ animated: true });
    const scrollViewProps = { ref: scrollViewRef };
    const setupProgressBar =
        isEditing && isDefined(budget) ? (
            <BudgetProgressBar
                currencySymbol={currencySymbol}
                spent={spent.spentOverall}
                limit={budget.overallLimit}
                spentTestID={BudgetSelector.SetupSpentLabel}
                remainingTestID={BudgetSelector.SetupRemainingLabel}
            />
        ) : null;

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <FormProvider {...form}>
            <CollapsibleChromePage
                title={headerTitle}
                leading={<GoBackButton onPress={handleCancel} />}
                contentClassName="gap-y-7xl"
                scrollViewProps={scrollViewProps}
                footer={
                    <View className="gap-md pt-xl px-7xl">
                        <BudgetEditFooter
                            onSubmit={handleSubmit}
                            disabled={isSaveDisabled}
                            deleteButton={<BudgetSetupDeleteButton isEditing={isEditing} onDelete={handleDelete} />}
                        />
                    </View>
                }
            >
                {setupProgressBar}
                <BudgetOverallLimitField control={form.control} currencySymbol={currencySymbol} />
                <BudgetInlineCategoryLimits currencySymbol={currencySymbol} onCategoryAdded={handleCategoryAdded} />
            </CollapsibleChromePage>
        </FormProvider>
    );
};
