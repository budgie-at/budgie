import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AmountInput } from '../../../../@generic/component/amount-input/amount-input';
import { Button } from '../../../../@generic/component/button/button';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { useBudgetSetupContext } from '../../../../budget/context/budget-setup.context';

export default function BudgetSetupAmountPage() {
    const { t } = useLingui();
    const { form } = useBudgetSetupContext();

    const overallLimit = form.watch('overallLimit');

    const handleGoBack = () => void router.back();

    const handleChangeValue = (value: number) => {
        form.setValue('overallLimit', value);
    };

    const handleContinue = () => {
        router.push('/budget/setup/category-limits');
    };

    /* jscpd:ignore-start */
    return (
        <Page header={<PageHeader title={t`Monthly Budget`} onGoBack={handleGoBack} />}>
            <View className="gap-y-lg py-7xl">
                <AmountInput value={overallLimit} onChangeValue={handleChangeValue} />
                <Button variant="primary" content={<Trans>Continue</Trans>} onPress={handleContinue} />
            </View>
        </Page>
    );
    /* jscpd:ignore-end */
}
