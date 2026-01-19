import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AmountInput } from '../../../../@generic/component/amount-input/amount-input';
import { Button } from '../../../../@generic/component/button/button';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { useShowError } from '../../../../@generic/hook/use-show-error.hook';
import { useBudgetSetupContext } from '../../../../budget/context/budget-setup.context';
import { budgetService } from '../../../../budget/service/budget.service';

export default function BudgetSetupAmountPage() {
    const { t } = useLingui();
    const { form } = useBudgetSetupContext();
    const showError = useShowError();

    const overallLimit = form.watch('overallLimit');

    const handleGoBack = () => void router.back();

    const handleChangeValue = (value: number) => {
        form.setValue('overallLimit', value);
    };

    const handleSubmit = async () => {
        try {
            const values = form.getValues();
            await budgetService.create(values);
            router.replace('/budget');
        } catch (error: unknown) {
            showError(error);
        }
    };

    /* jscpd:ignore-start */
    return (
        <Page header={<PageHeader title={t`Monthly Budget`} onGoBack={handleGoBack} />}>
            <View className="gap-y-lg py-7xl">
                <AmountInput value={overallLimit} onChangeValue={handleChangeValue} />
                <Button variant="primary" content={<Trans>Create Budget</Trans>} onPress={handleSubmit} />
            </View>
        </Page>
    );
    /* jscpd:ignore-end */
}
