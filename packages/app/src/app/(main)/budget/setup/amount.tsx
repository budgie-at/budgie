import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AmountInput } from '../../../../@generic/component/amount-input/amount-input';
import { Button } from '../../../../@generic/component/button/button';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { BUDGET_PERIOD_TITLE } from '../../../../budget/constant/budget-period-title.constant';
import { useBudgetSetupContext } from '../../../../budget/context/budget-setup.context';

export default function BudgetSetupAmountPage() {
    const { i18n } = useLingui();
    const { form } = useBudgetSetupContext();

    const period = form.watch('period');
    const overallLimit = form.watch('overallLimit');
    const title = i18n.t(BUDGET_PERIOD_TITLE[period]);

    const handleGoBack = () => void router.back();

    const handleChangeValue = (value: number) => {
        form.setValue('overallLimit', value);
    };

    const handleContinue = () => {
        router.push('/budget/setup/category-limits');
    };

    /* jscpd:ignore-start */
    return (
        <Page header={<PageHeader title={title} onGoBack={handleGoBack} />}>
            <View className="gap-y-lg py-7xl">
                <AmountInput value={overallLimit} onChangeValue={handleChangeValue} />
                <Button variant="primary" content={<Trans>Continue</Trans>} onPress={handleContinue} />
            </View>
        </Page>
    );
    /* jscpd:ignore-end */
}
