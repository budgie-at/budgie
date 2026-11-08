import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { Button } from '../../../@generic/component/button/button';
import { StateCard } from '../../../@generic/component/state-card/state-card';

import { AccountsEmptyStateSelector } from './accounts-empty-state.selector';

export const AccountsEmptyState = () => {
    const router = useRouter();

    const handleAddAccount = () => void router.push('/create-account');

    return (
        <StateCard
            icon={UserIconNameEnum.Wallet}
            title={<Trans>No accounts yet</Trans>}
            description={<Trans>Add your first account to start tracking your finances</Trans>}
        >
            <Button
                variant="cta"
                size="md"
                leftIcon={UserIconNameEnum.Plus}
                onPress={handleAddAccount}
                content={<Trans>Add Account</Trans>}
                testID={AccountsEmptyStateSelector.AddAccountButton}
            />
        </StateCard>
    );
};
