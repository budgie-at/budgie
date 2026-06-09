import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../../@generic/component/button/button';
import { FormPage } from '../../../../@generic/component/form-page/form-page';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { isEnumValue } from '../../../../@generic/type-guard/is-enum-value.type-guard';
import { BudgetSelector } from '../../../../budget/budget.selector';
import { BudgetEditFooter } from '../../../../budget/components/budget-edit-footer/budget-edit-footer';
import { BudgetInlineCategoryLimits } from '../../../../budget/components/budget-inline-category-limits/budget-inline-category-limits';
import { BudgetMissingCurrencyGuard } from '../../../../budget/components/budget-missing-currency-guard/budget-missing-currency-guard';
import { BudgetOverallLimitField } from '../../../../budget/components/budget-overall-limit-field/budget-overall-limit-field';
import { BudgetSetupProgressBar } from '../../../../budget/components/budget-setup-progress-bar/budget-setup-progress-bar';
import { BudgetFormSchema } from '../../../../budget/constant/budget-form-schema.constant';
import { BudgetTemplateKindEnum } from '../../../../budget/enum/budget-template-kind.enum';
import { useBudgetForm } from '../../../../budget/hooks/use-budget-form.hook';
import { useGetBudgetSpentQuery } from '../../../../budget/query/use-get-budget-spent.query';
import { useGetInstrumentByIdQuery } from '../../../../instrument/query/use-get-instrument-by-id.query';
import { useSetting } from '../../../../settings/hook/use-setting.hook';

import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

const FORM_CONTENT_STYLE = { rowGap: 24 } as const;
const FORM_EXTRA_BOTTOM_PADDING = 48;

const parseTemplateKind = (value: string | undefined): BudgetTemplateKindEnum | null =>
    isEnumValue(value, BudgetTemplateKindEnum) ? value : null;

const getFallbackScreen = (isLoading: boolean, defaultInstrumentId: number | null) => {
    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isPositiveNumber(defaultInstrumentId)) {
        return <BudgetMissingCurrencyGuard />;
    }

    return null;
};

const getDeleteButton = (isEditing: boolean, handleDelete: () => Promise<void>) => {
    const onDeletePress = () => void handleDelete();

    return isEditing ? (
        <Button
            testID={BudgetSelector.SetupDeleteButton}
            variant="destructive"
            leftIcon={UserIconNameEnum.Trash2}
            onPress={onDeletePress}
        />
    ) : null;
};

// eslint-disable-next-line max-statements -- Form orchestration screen with multiple hooks and handlers
export default function BudgetSetupScreen() {
    const { id, template } = useLocalSearchParams<{ id?: string; template?: string }>();
    const [editingId] = useState<number | null>(() => (isDefined(id) ? Number(id) : null));
    const [templateKind] = useState<BudgetTemplateKindEnum | null>(() => (isDefined(id) ? null : parseTemplateKind(template)));

    const scrollViewRef = useRef<KeyboardAwareScrollViewRef | null>(null);
    const defaultInstrumentId = useSetting('defaultInstrumentId');
    const { form, handleCancel, handleSubmit, handleDelete, isEditing, isLoading, budget } = useBudgetForm({ editingId, templateKind });
    const [overallLimit, categoryLimits, watchedInstrumentId] = useWatch({
        control: form.control,
        name: ['overallLimit', 'categoryLimits', 'instrumentId']
    });
    const { spent } = useGetBudgetSpentQuery(budget);
    const instrumentId = isPositiveNumber(watchedInstrumentId) ? watchedInstrumentId : (defaultInstrumentId ?? 0);
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const isSaveDisabled = !BudgetFormSchema.safeParse({ ...form.getValues(), overallLimit, categoryLimits, instrumentId }).success;
    const fallbackScreen = getFallbackScreen(isLoading, defaultInstrumentId);
    const currencySymbol = instrument?.symbol ?? '';
    const handleCategoryAdded = () => scrollViewRef.current?.scrollToEnd({ animated: true });

    if (isDefined(fallbackScreen)) {
        return fallbackScreen;
    }

    const headerTitle = isEditing ? t`Edit budget` : t`Create budget`;

    return (
        <FormProvider {...form}>
            <FormPage
                scrollViewRef={scrollViewRef}
                header={<PageHeader title={headerTitle} onGoBack={handleCancel} />}
                footer={
                    <BudgetEditFooter
                        onSubmit={handleSubmit}
                        disabled={isSaveDisabled}
                        deleteButton={getDeleteButton(isEditing, handleDelete)}
                    />
                }
                contentContainerStyle={FORM_CONTENT_STYLE}
                extraBottomPadding={FORM_EXTRA_BOTTOM_PADDING}
            >
                <BudgetSetupProgressBar
                    budget={budget}
                    currencySymbol={currencySymbol}
                    isEditing={isEditing}
                    spentOverall={spent.spentOverall}
                />
                <BudgetOverallLimitField control={form.control} autoFocus={!isEditing} currencySymbol={currencySymbol} />
                <BudgetInlineCategoryLimits currencySymbol={currencySymbol} onCategoryAdded={handleCategoryAdded} />
            </FormPage>
        </FormProvider>
    );
}
