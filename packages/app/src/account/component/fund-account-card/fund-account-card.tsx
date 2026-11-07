import { AccountWithSyncEntityInterface } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { AccountCardBalance } from '../account-card-balance/account-card-balance';
import { AccountCardBase } from '../account-card-base/account-card-base';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
    readonly convertedBalance: number | null;
}

export const FundAccountCard = ({ account, balance, convertedBalance }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const formatFundQuantity = useFormatFundQuantity();

    const isAmountProtected = useIsAmountProtected();
    const quantityLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatFundQuantity(balance);
    const valueLabel = isDefined(convertedBalance) ? protectAmount(convertedBalance, defaultInstrument.symbol) : t`value unavailable`;
    const value = isDefined(convertedBalance) ? (
        <AccountCardBalance title={account.title} balance={convertedBalance} instrumentSymbol={defaultInstrument.symbol} />
    ) : (
        <Text maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER} className="text-[15px] font-medium text-secondary-foreground">
            <Trans>Value unavailable</Trans>
        </Text>
    );

    return (
        <AccountCardBase
            account={account}
            balance={balance}
            convertedBalance={null}
            amountLabel={t`${quantityLabel}, worth ${valueLabel}`}
            subtitle={quantityLabel}
        >
            {value}
        </AccountCardBase>
    );
};
