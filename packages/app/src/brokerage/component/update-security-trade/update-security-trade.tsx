import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Redirect } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { roundHalfExpand } from '../../../market-data/utils/round-half-expand.util';
import { getSecurityTrade } from '../../../transaction/utils/get-security-trade.util';
import { SECURITY_PRICE_MAX_DECIMALS } from '../../constant/security-price-max-decimals.constant';
import { SecurityTradeSideEnum } from '../../enum/security-trade-side.enum';
import { BrokerageService } from '../../service/brokerage.service';
import { SecurityHoldingRow } from '../security-holding-row/security-holding-row';
import { SecurityTradeForm } from '../security-trade-form/security-trade-form';

import type { UpdateTransactionFormPropsInterface } from '../../../transaction/interface/update-transaction-form-props.interface';
import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';

export const UpdateSecurityTrade = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const trade = getSecurityTrade(transaction);
    const { balance } = useAccountBalanceQuery(trade?.securityEntry.accountId ?? 0);

    if (!isDefined(trade)) {
        return <Redirect href="/" />;
    }

    const quantity = convertFromMicroUnits(trade.quantity);
    const fee = convertFromMicroUnits(trade.fee);
    const total = convertFromMicroUnits(Math.abs(trade.cashFlow));
    const { instrument } = trade.securityEntry.account;
    const side = trade.isBuy ? SecurityTradeSideEnum.BUY : SecurityTradeSideEnum.SELL;
    const maxQuantity = trade.isBuy ? null : balance + quantity;
    const suggestedPrice = { price: null, missingRateCurrency: null, isUnavailable: false };
    const defaultValues = {
        quantity,
        price: roundHalfExpand((total + (trade.isBuy ? -fee : fee)) / quantity, SECURITY_PRICE_MAX_DECIMALS),
        fee,
        total,
        operatedAt: transaction.operatedAt
    };

    const handleSubmit = (values: SecurityTradeFormValues) =>
        Effect.flatMap(BrokerageService, brokerageService =>
            brokerageService.update(transaction.id, values, t({ message: 'Deposit', context: 'Brokerage funding' }))
        );

    return (
        <SecurityTradeForm
            side={side}
            symbol={instrument.symbol}
            currencySymbol={trade.cashInstrument.symbol}
            maxQuantity={maxQuantity}
            suggestedPrice={suggestedPrice}
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
        >
            <SecurityHoldingRow balance={balance} instrument={instrument} />
        </SecurityTradeForm>
    );
};
