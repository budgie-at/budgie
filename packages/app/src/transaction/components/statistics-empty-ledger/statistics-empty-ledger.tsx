import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { Button } from '../../../@generic/component/button/button';
import { StatsEmptyCard } from '../../../@generic/component/stats-empty-card/stats-empty-card';

interface Props {
    readonly testID: string;
}

export const StatisticsEmptyLedger = ({ testID }: Props) => {
    const { t } = useLingui();

    const handleAddTransaction = () => void router.push('/create-transaction/expense');

    return (
        <StatsEmptyCard
            testID={testID}
            icon={UserIconNameEnum.ChartColumn}
            title={t`No spending or income yet`}
            description={t`Add your first transaction to see where your money goes.`}
        >
            <Button onPress={handleAddTransaction} leftIcon={UserIconNameEnum.Plus} content={t`Add a transaction`} />
        </StatsEmptyCard>
    );
};
