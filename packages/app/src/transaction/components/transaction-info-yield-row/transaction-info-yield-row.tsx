import { InstrumentTypeEnum, UserIconNameEnum, YieldKindEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { YIELD_KIND_LABEL } from '../../../yield/constant/yield-kind-label.constant';
import { YIELD_POSITION_ACCOUNT_TYPES } from '../../../yield/constant/yield-position-account-types.constant';
import { useEditTransactionYield } from '../../hook/use-edit-transaction-yield.hook';
import { findYieldLandingAccount } from '../../utils/find-yield-landing-account.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';
import { TransactionInfoYieldSourceRow } from '../transaction-info-yield-source-row/transaction-info-yield-source-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoYieldRow = ({ transaction }: Props) => {
    const { t } = useLingui();
    const { openKindPicker } = useEditTransactionYield(transaction);
    const { account: source } = useGetAccountByIdQuery(transaction.yieldSourceAccountId ?? 0);

    const kind = transaction.yieldKind;

    if (!isDefined(kind) || kind === YieldKindEnum.NONE) {
        return null;
    }

    const landing = findYieldLandingAccount(transaction);
    const canLandingHoldPosition =
        isDefined(landing) && (YIELD_POSITION_ACCOUNT_TYPES.includes(landing.type) || landing.instrument.type === InstrumentTypeEnum.FUND);
    const positionId = transaction.yieldSourceAccountId ?? (canLandingHoldPosition ? landing.id : null);
    const kindLabel = t(YIELD_KIND_LABEL[kind]);
    const sourceTitle = source?.title;
    const value = isDefined(sourceTitle) ? t`${kindLabel} · from ${sourceTitle}` : kindLabel;

    const handleOpenScreen = () =>
        void router.push({ pathname: '/passive-income', params: isDefined(positionId) ? { position: String(positionId) } : {} });

    return (
        <>
            <TransactionInfoRow
                icon={UserIconNameEnum.Sprout}
                label={t`Passive income`}
                value={value}
                testID={TransactionInfoPageSelector.Row.Yield}
                onPress={handleOpenScreen}
            />
            <TransactionInfoRow
                icon={UserIconNameEnum.Tag}
                label={t`Kind`}
                value={kindLabel}
                testID={TransactionInfoPageSelector.Row.YieldKind}
                onPress={openKindPicker}
            />
            <TransactionInfoYieldSourceRow transaction={transaction} />
        </>
    );
};
