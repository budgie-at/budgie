import { TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useFormatInstrumentAmount } from '../../i18n/hook/use-format-instrument-amount.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const MINUS = '−';

export const useYieldPayoutAmount = (transaction: TransactionWithRelationsEntityInterface, isTax: boolean): string => {
    const formatAmount = useProtectedAmountLabel();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const account = transaction.type === TransactionTypeEnum.EXPENSE ? transaction.fromAccount : transaction.toAccount;
    const entry = transaction.entries.find(candidate => candidate.accountId === account?.id);
    const baseAmount = entry?.baseAmount ?? null;
    const nativeLabel = isDefined(entry)
        ? formatInstrumentAmount(
              Math.abs(convertFromMicroUnits(entry.amount)),
              entry.account.instrument.symbol,
              entry.account.instrument.type
          )
        : '';
    const amountLabel = isDefined(baseAmount) ? formatAmount(Math.abs(convertFromMicroUnits(baseAmount)), symbol) : nativeLabel;

    return isTax ? `${MINUS}${amountLabel}` : amountLabel;
};
