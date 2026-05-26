import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '../../../../@generic/component/button/button';
import { FormPage } from '../../../../@generic/component/form-page/form-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { BudgetAllocationSummary } from '../../../../budget/components/budget-allocation-summary/budget-allocation-summary';
import { BudgetCategoryLimitsField } from '../../../../budget/components/budget-category-limits-field/budget-category-limits-field';
import { BudgetFormValues } from '../../../../budget/constant/budget-form-schema.constant';

const FORM_CONTENT_STYLE = { rowGap: 24 } as const;

const handleGoBack = () => void router.back();

export default function BudgetCategoryLimitsScreen() {
    const { t } = useLingui();
    const { formState } = useFormContext<BudgetFormValues>();

    const footer = (
        <View className="gap-y-md">
            <BudgetAllocationSummary />
            <Button variant="cta" content={t`Done`} onPress={handleGoBack} disabled={!formState.isValid} />
        </View>
    );

    return (
        <FormPage
            header={<PageHeader title={t`Category limits`} onGoBack={handleGoBack} />}
            footer={footer}
            contentContainerStyle={FORM_CONTENT_STYLE}
        >
            <BudgetCategoryLimitsField />
        </FormPage>
    );
}
