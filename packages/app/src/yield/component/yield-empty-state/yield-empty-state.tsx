import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

export const YieldEmptyState = () => {
    const { t } = useLingui();

    const handleConnect = () => void router.push('/create-account');
    const handleAddDeposit = () => void router.push({ pathname: '/create-account/[type]', params: { type: AccountTypeEnum.DEPOSIT } });
    const handleExplain = () => void router.push('/passive-income-info');

    return (
        <View className="flex-1 justify-center gap-y-xl px-5xl" testID={PassiveIncomeSelector.EmptyState}>
            <EmptyState
                icon={UserIconNameEnum.Sprout}
                title={t`Passive income`}
                description={t`Passive income shows up here when you earn staking rewards, dividends or interest`}
            />
            <Button content={t`Connect an exchange`} leftIcon={UserIconNameEnum.Link} onPress={handleConnect} variant="primary" />
            <Button content={t`Add a deposit`} leftIcon={UserIconNameEnum.PiggyBank} onPress={handleAddDeposit} variant="secondary" />
            <Button content={t`How is this calculated?`} onPress={handleExplain} variant="ghost" />
        </View>
    );
};
