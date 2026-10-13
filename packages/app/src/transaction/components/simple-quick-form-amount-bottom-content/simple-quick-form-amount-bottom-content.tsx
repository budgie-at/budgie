import { InstrumentTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { DebtSettlementPill } from '../debt-settlement-pill/debt-settlement-pill';
import { SimpleQuickFormFeePill } from '../simple-quick-form-fee-pill/simple-quick-form-fee-pill';

import type { DebtSettlementAccountInterface } from '../../interface/debt-settlement-account.interface';

interface Props {
    readonly debtSettlementAccount: DebtSettlementAccountInterface | null;
    readonly feeAmount: number;
    readonly feeCurrencySymbol: string;
    readonly feeInstrumentType: InstrumentTypeEnum;
    readonly showInlineFeeAction: boolean;
    readonly onFeePress: () => void;
}

export const SimpleQuickFormAmountBottomContent = ({
    debtSettlementAccount,
    feeAmount,
    feeCurrencySymbol,
    feeInstrumentType,
    showInlineFeeAction,
    onFeePress
}: Props) => (
    <View className="items-center gap-xs">
        <DebtSettlementPill account={debtSettlementAccount} />
        <SimpleQuickFormFeePill
            amount={feeAmount}
            currencySymbol={feeCurrencySymbol}
            instrumentType={feeInstrumentType}
            showInlineAction={showInlineFeeAction}
            onPress={onFeePress}
        />
    </View>
);
