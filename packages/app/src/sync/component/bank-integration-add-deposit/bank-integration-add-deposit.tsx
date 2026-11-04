import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useBankIntegration } from '../../context/bank-integration.context';

export const BankIntegrationAddDeposit = () => {
    const { integration, capabilities } = useBankIntegration();
    const handleAddDeposit = () =>
        void router.push({
            pathname: '/create-account/[type]',
            params: { type: AccountTypeEnum.DEPOSIT, integrationId: String(integration.id) }
        });

    return capabilities.supportsDeposit ? (
        <GroupedListRow
            title={
                <Text className="text-[17px] light:text-cash-action dark:text-default-foreground">
                    <Trans>Add deposit</Trans>
                </Text>
            }
            left={
                <CircleIcon
                    icon={UserIconNameEnum.Plus}
                    variant="primary"
                    size={36}
                    iconSize={18}
                    border={false}
                    className={TONAL_DISC_BACKGROUND.primary}
                />
            }
            onPress={handleAddDeposit}
            right={<View />}
            testID={BankIntegrationSelector.AddDepositButton}
        />
    ) : null;
};
