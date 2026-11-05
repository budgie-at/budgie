import { RecurringSeriesKindEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';

import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { showActionToast } from '../../../@generic/utils/show-action-toast/show-action-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { TransactionInfoRow } from '../../../transaction/components/transaction-info-row/transaction-info-row';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';

import type { RecurringHistoryItemInterface } from '@budgie/recurring';

interface Props {
    readonly seriesId: number;
    readonly kind: RecurringSeriesKindEnum;
    readonly item: RecurringHistoryItemInterface;
}

export const RecurringDetailHistoryRow = ({ seriesId, kind, item }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const { formatWeekdayAndDay } = useFormatDate();
    const { transactionId } = item;
    const pathname = kind === RecurringSeriesKindEnum.INCOME ? '/transactions/[id]/income' : '/transactions/[id]/expense';

    const handleOpen = () => void router.push({ pathname, params: { id: String(transactionId) } });

    const handleExclude = () => {
        appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    const recurringService = yield* RecurringService;
                    yield* recurringService.excludeTransaction(seriesId, transactionId);
                    showActionToast(t`Removed from this series`, {
                        label: t`Undo`,
                        onPress: () =>
                            void appRuntime.runFork(
                                logAndContinue(
                                    Effect.flatMap(RecurringService, service => service.addTransaction(seriesId, transactionId)).pipe(
                                        toastOnFailure(t`Could not update recurring payment.`)
                                    )
                                )
                            )
                    });
                }).pipe(toastOnFailure(t`Could not update recurring payment.`))
            )
        );
    };

    return (
        <DeletableRow id={transactionId} onDelete={handleExclude} label={t`Not part of this`}>
            <TransactionInfoRow
                icon={UserIconNameEnum.CircleCheck}
                value={formatWeekdayAndDay(item.operatedAt)}
                trailing={protectAmount(convertFromMicroUnits(item.amount), defaultInstrument.symbol)}
                testID={RecurringDetailSelector.HistoryRow(transactionId)}
                onPress={handleOpen}
            />
        </DeletableRow>
    );
};
