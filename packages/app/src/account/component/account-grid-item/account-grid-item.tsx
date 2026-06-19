import { AccountTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { AccountCard } from '../account-card/account-card';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { AccountWithBankSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithBankSyncEntityInterface;
    readonly balance: number;
    readonly balanceRow: HomeAccountBalanceInterface | null | undefined;
    readonly type: AccountTypeEnum;
    readonly isLeft: boolean;
}

export const AccountGridItem = ({ account, balance, balanceRow, type, isLeft }: Props) => {
    const { id, title, icon, instrument, deadline, debtType, targetBalance, createdAt, bankSync } = account;
    const { defaultInstrument } = useSettingsContext();

    const containerClassName = isLeft ? 'flex-1 pr-1.5' : 'flex-1 pl-1.5';
    const shouldUseDefaultInstrumentDebtSummary = type === AccountTypeEnum.DEBT && isDefined(balanceRow);
    const cardBalance = shouldUseDefaultInstrumentDebtSummary ? balanceRow.convertedBalance : balance;
    const cardDebtProgressSummary = shouldUseDefaultInstrumentDebtSummary
        ? balanceRow.convertedDebtProgressSummary
        : balanceRow?.debtProgressSummary;
    const cardInstrumentId = shouldUseDefaultInstrumentDebtSummary ? defaultInstrument.id : instrument.id;
    const cardInstrumentCode = shouldUseDefaultInstrumentDebtSummary ? defaultInstrument.code : instrument.code;
    const cardInstrumentSymbol = shouldUseDefaultInstrumentDebtSummary ? defaultInstrument.symbol : instrument.symbol;
    const cardTargetBalance = shouldUseDefaultInstrumentDebtSummary
        ? balanceRow.convertedTargetBalance
        : convertFromMicroUnits(targetBalance);

    return (
        <View className={containerClassName}>
            <AccountCard
                targetBalance={cardTargetBalance}
                type={type}
                id={id}
                balance={cardBalance}
                deadline={deadline}
                debtType={debtType}
                icon={icon}
                title={title}
                createdAt={createdAt}
                bankSync={bankSync}
                debtProgressSummary={cardDebtProgressSummary}
                instrumentId={cardInstrumentId}
                instrumentCode={cardInstrumentCode}
                instrumentSymbol={cardInstrumentSymbol}
            />
        </View>
    );
};
