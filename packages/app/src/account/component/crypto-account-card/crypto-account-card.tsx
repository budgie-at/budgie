import { AccountEntityInterface, InstrumentTypeEnum, SyncEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';
import { SyncStatusDot } from '../sync-status-dot/sync-status-dot';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly balance: number;
    readonly sync: SyncEntityInterface | null;
    readonly className?: string;
    readonly instrumentCode: string;
    readonly instrumentSymbol: string;
}

export const CryptoAccountCard = (props: Props) => {
    const { id, title, icon, balance, sync, className, instrumentCode, instrumentSymbol } = props;
    const formatInstrumentAmount = useFormatInstrumentAmount();

    const formattedBalance = formatInstrumentAmount(balance, instrumentCode, InstrumentTypeEnum.CRYPTO);

    const balanceContent = (
        <View className="gap-y-1">
            <ProtectedText className="text-primary font-medium" testID={AccountCardBaseSelector.Balance(title, formattedBalance)}>
                {formattedBalance}
            </ProtectedText>
        </View>
    );

    return (
        <AccountCardBase
            id={id}
            title={title}
            icon={icon}
            balance={balance}
            className={className}
            instrumentSymbol={instrumentSymbol}
            balanceContent={balanceContent}
            bottomRight={<SyncStatusDot sync={sync} />}
        />
    );
};
