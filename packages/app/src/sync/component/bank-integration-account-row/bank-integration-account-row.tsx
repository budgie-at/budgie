import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID } from '../../../@generic/utils/test-id.util';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useAccountSync } from '../../hook/use-account-sync.hook';
import { monobankSyncService } from '../../service/monobank-sync.service';

interface Props {
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'title' | 'icon' | AccountAssociationEnum.INSTRUMENT>;
    readonly isLiveApi: boolean;
}

export const BankIntegrationAccountRow = ({ account, isLiveApi }: Props) => {
    const { balance } = useAccountBalanceQuery(account.id);
    const { sync, hasSync } = useAccountSync(account.id);
    const formatDigits = useDisplayFormatDigits();

    const rowTestID = BankIntegrationSelector.AccountRow(account.id);
    const handleToggle = (enabled: boolean) => void monobankSyncService.setAccountSyncEnabled(account.id, enabled);

    const toggle =
        isLiveApi && hasSync && isDefined(sync) ? (
            <ThemedSwitch value={sync.enabled} onValueChange={handleToggle} {...testID(rowTestID, TestIDPartEnum.TOGGLE)} />
        ) : null;

    return (
        <SimpleHorizontalCell
            testID={rowTestID}
            singleLine
            left={<CircleIcon icon={account.icon} variant="ghost" size={46} iconSize={20} border={false} />}
            title={account.title}
            right={
                <View className="flex-row items-center gap-x-lg">
                    <ProtectedText className="text-primary text-sm font-semibold">
                        {formatDigits(balance, account.instrument.symbol)}
                    </ProtectedText>

                    {toggle}
                </View>
            }
        />
    );
};
