import { InstrumentTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { DebtSettlementPill } from '../debt-settlement-pill/debt-settlement-pill';
import { SimpleQuickFormFeePill } from '../simple-quick-form-fee-pill/simple-quick-form-fee-pill';

interface Props {
    readonly debtSettlementAccountTitle: string | null;
    readonly feeAmount: number;
    readonly feeCurrencySymbol: string;
    readonly feeInstrumentType: InstrumentTypeEnum;
    readonly showInlineFeeAction: boolean;
    readonly onFeePress: () => void;
}

export const SimpleQuickFormAmountBottomContent = ({
    debtSettlementAccountTitle,
    feeAmount,
    feeCurrencySymbol,
    feeInstrumentType,
    showInlineFeeAction,
    onFeePress
}: Props) => (
    <View className="items-center gap-xs">
        <DebtSettlementPill accountTitle={debtSettlementAccountTitle} />
        <SimpleQuickFormFeePill
            amount={feeAmount}
            currencySymbol={feeCurrencySymbol}
            instrumentType={feeInstrumentType}
            showInlineAction={showInlineFeeAction}
            onPress={onFeePress}
        />
    </View>
);
