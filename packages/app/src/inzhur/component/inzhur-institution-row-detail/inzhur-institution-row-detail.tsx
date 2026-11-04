import { InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useInzhurStatementReminderQuery } from '../../query/use-inzhur-statement-reminder.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { isInzhurCashAccount } from '../../utils/is-inzhur-cash-account.util';

import type { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly accounts: readonly Pick<
        AccountWithSyncEntityInterface,
        'id' | 'externalSource' | 'externalId' | AccountAssociationEnum.INSTRUMENT
    >[];
}

export const InzhurInstitutionRowDetail = ({ accounts }: Props) => {
    const { t } = useLingui();
    const reminder = useInzhurStatementReminderQuery();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const cashAccount = accounts.find(isInzhurCashAccount);
    const { balance: cashBalance } = useAccountBalanceQuery(cashAccount?.id ?? 0);

    const fundCount = accounts.filter(account => account.instrument.type === InstrumentTypeEnum.FUND).length;
    const fundsLabel = t({ message: plural(fundCount, { one: '# fund', other: '# funds' }) });
    const cashLabel = protectAmount(cashBalance, defaultInstrument.symbol);
    const holdingsLabel = isDefined(cashAccount) ? t`${fundsLabel} · Cash ${cashLabel}` : fundsLabel;
    const staleLabel = isDefined(reminder)
        ? t({ message: plural(reminder.daysOld, { one: 'Statement # day old', other: 'Statement # days old' }) })
        : null;

    const toneClassName = isDefined(staleLabel) ? 'text-warning-strong' : 'text-secondary-foreground';

    return (
        <Text
            className={cn('text-[13px] tabular-nums', toneClassName)}
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            numberOfLines={2}
            testID={InzhurSelector.InstitutionDetail}
        >
            {staleLabel ?? holdingsLabel}
        </Text>
    );
};
