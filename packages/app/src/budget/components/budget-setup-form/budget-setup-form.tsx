import { t } from '@lingui/core/macro';
import * as Schema from 'effect/Schema';
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
import { BudgetAutoTuneField } from '../budget-auto-tune-field/budget-auto-tune-field';
import { BudgetDeleteButton } from '../budget-delete-button/budget-delete-button';
import { BudgetEditFooter } from '../budget-edit-footer/budget-edit-footer';
import { BudgetInlineCategoryLimits } from '../budget-inline-category-limits/budget-inline-category-limits';
import { BudgetLimitSourceField } from '../budget-limit-source-field/budget-limit-source-field';
import { BudgetNameField } from '../budget-name-field/budget-name-field';
import { BudgetPeriodField } from '../budget-period-field/budget-period-field';
import { BudgetSetupProgress } from '../budget-setup-progress/budget-setup-progress';
import { BudgetStartsOnField } from '../budget-starts-on-field/budget-starts-on-field';

import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

interface Props {
    readonly defaultInstrumentId: number;
    readonly editingId: number | null;
    readonly templateKind: BudgetTemplateKindEnum | null;
}

export const BudgetSetupForm = ({ defaultInstrumentId, editingId, templateKind }: Props) => {
    const scrollViewRef = useRef<KeyboardAwareScrollViewRef | null>(null);
    const { form, handleCancel, handleSubmit, handleDelete, handlePeriodChange, isEditing, isLoading, budget } = useBudgetForm({
        defaultInstrumentId,
        editingId,
        templateKind
    });
    const [overallLimit, otherLimit, categoryLimits, watchedInstrumentId] = useWatch({
        control: form.control,
        name: ['overallLimit', 'otherLimit', 'categoryLimits', 'instrumentId']
    });
    const instrumentId = isPositiveNumber(watchedInstrumentId) ? watchedInstrumentId : defaultInstrumentId;
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const isSaveDisabled = !Schema.is(BudgetFormSchema.from)({
        ...form.getValues(),
        overallLimit,
        otherLimit,
        categoryLimits,
        instrumentId
    });
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const headerTitle = isEditing ? t`Edit budget` : t`Create budget`;
    const handleCategoryAdded = () => scrollViewRef.current?.scrollToEnd({ animated: true });
    const scrollViewProps = { ref: scrollViewRef };
    const setupProgressBar =
        isEditing && isDefined(budget) ? <BudgetSetupProgress budget={budget} currencySymbol={currencySymbol} /> : null;

    const deleteButton = isEditing ? <BudgetDeleteButton testID={BudgetSelector.SetupDeleteButton} onDelete={handleDelete} /> : null;

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
                        <BudgetEditFooter onSubmit={handleSubmit} disabled={isSaveDisabled} deleteButton={deleteButton} />
                    </View>
                }
            >
                {setupProgressBar}
                <View className="gap-y-lg">
                    <BudgetNameField
                        control={form.control}
                        name="name"
                        placeholder={t`Budget name`}
                        testID={BudgetSelector.SetupNameInput}
                    />
                    <BudgetPeriodField onPeriodChange={handlePeriodChange} />
                    <BudgetStartsOnField />
                </View>
                <BudgetLimitSourceField currencySymbol={currencySymbol} />
                <BudgetAutoTuneField />
                <BudgetInlineCategoryLimits currencySymbol={currencySymbol} onCategoryAdded={handleCategoryAdded} />
            </CollapsibleChromePage>
        </FormProvider>
    );
};
