import { BudgetPeriodEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '../../../../@generic/component/button/button';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useBudgetSetupContext } from '../../../../budget/context/budget-setup.context';

export default function BudgetSetupPeriodPage() {
    const { t } = useLingui();
    const { form } = useBudgetSetupContext();

    const handleGoBack = () => void goBackOrReplace('/');

    const handleSelectPeriod = (period: BudgetPeriodEnum) => {
        form.setValue('period', period);
        router.push('/budget/setup/rollover');
    };

    const handleSelectWeekly = () => void handleSelectPeriod(BudgetPeriodEnum.WEEKLY);
    const handleSelectBiWeekly = () => void handleSelectPeriod(BudgetPeriodEnum.BI_WEEKLY);
    const handleSelectMonthly = () => void handleSelectPeriod(BudgetPeriodEnum.MONTHLY);

    /* jscpd:ignore-start */
    return (
        <Page header={<PageHeader title={t`Budget Period`} onGoBack={handleGoBack} />}>
            <View className="gap-y-lg py-7xl">
                <Button variant="ghost" content={<Trans>Weekly</Trans>} onPress={handleSelectWeekly} />
                <Button variant="ghost" content={<Trans>Bi-weekly</Trans>} onPress={handleSelectBiWeekly} />
                <Button variant="ghost" content={<Trans>Monthly</Trans>} onPress={handleSelectMonthly} />
            </View>
        </Page>
    );
    /* jscpd:ignore-end */
}
