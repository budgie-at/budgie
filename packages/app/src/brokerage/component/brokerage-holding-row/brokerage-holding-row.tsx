import { ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { AccountCardBalance } from '../../../account/component/account-card-balance/account-card-balance';
import { AccountCardBase } from '../../../account/component/account-card-base/account-card-base';
import { AccountRowLeadingContext } from '../../../account/context/account-row-leading.context';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { BrokerageReturnText } from '../brokerage-return-text/brokerage-return-text';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { BrokerageHoldingInterface } from '../../interface/brokerage-holding.interface';

interface Props {
    readonly holding: BrokerageHoldingInterface;
    readonly balance: number;
    readonly bankName: string | null;
    readonly instrumentSymbol: string;
    readonly position: TransactionListRowPositionEnum;
}

export const BrokerageHoldingRow = ({ holding, balance, bankName, instrumentSymbol, position }: Props) => {
    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const protectAmount = useProtectedAmountLabel();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const formatPercent = useFormatPercent();

    const { account, label, value, isValued, weight, gain, gainPercent } = holding;
    const { instrument } = account;
    const isSecurity = isListedSecurityType(instrument.type);
    const displayAccount = isSecurity ? account : { ...account, title: label };
    const quantityLabel = isAmountProtected
        ? PROTECTED_AMOUNT_PLACEHOLDER
        : formatInstrumentAmount(balance, instrument.symbol, instrument.type);
    const weightLabel = isDefined(weight) && !isAmountProtected ? formatPercent(weight) : null;
    const subtitle = [quantityLabel, weightLabel].filter(isDefined).join(' · ');
    const valueLabel = isValued ? protectAmount(value, instrumentSymbol) : t`value unavailable`;
    const leading = isSecurity ? (
        <CurrencySelectorInstrumentIcon code={instrument.code} symbol={instrument.symbol} type={instrument.type} size={44} />
    ) : (
        <BankLogo bankProvider={ExternalSourceEnum.MANUAL} bankName={bankName ?? account.title} size={44} />
    );

    return (
        <TransactionRowSurface separatorInset={64} position={position}>
            <AccountRowLeadingContext value={leading}>
                <AccountCardBase
                    account={displayAccount}
                    balance={balance}
                    convertedBalance={null}
                    amountLabel={t`${quantityLabel}, worth ${valueLabel}`}
                    subtitle={subtitle}
                >
                    {isValued ? (
                        <AccountCardBalance title={displayAccount.title} balance={value} instrumentSymbol={instrumentSymbol} />
                    ) : (
                        <Text
                            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                            className="text-[15px] font-medium text-secondary-foreground"
                        >
                            <Trans>Value unavailable</Trans>
                        </Text>
                    )}
                    {isDefined(gain) ? <BrokerageReturnText gain={gain} percent={gainPercent} instrumentSymbol={instrumentSymbol} /> : null}
                </AccountCardBase>
            </AccountRowLeadingContext>
        </TransactionRowSurface>
    );
};
