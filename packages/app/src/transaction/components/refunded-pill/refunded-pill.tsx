import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { t } from '@lingui/core/macro';
import { useEffect, useState } from 'react';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { transactionRepository } from '../../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RefundedSummaryKindEnum } from '../../enum/refunded-summary-kind.enum';
import { computeRefundedSummary } from '../../utils/compute-refunded-summary.util';
import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly onPress?: () => void;
    readonly testID?: string;
}

const logger = getLogger('RefundedPill');

export const RefundedPill = ({ transaction, onPress, testID }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const isRefund = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    const [refundsTotal, setRefundsTotal] = useState<number | null>(null);

    useEffect(() => {
        let isActive = true;

        const fetchRefundsTotal = async (): Promise<void> => {
            const sources = await transactionRepository.findConsolidationSources(transaction.id);
            const total = sources
                .filter(source => source.entryType === TransactionEntryTypeEnum.DEBIT)
                .reduce((sum, source) => sum + source.amount, 0);

            if (isActive) {
                setRefundsTotal(total);
            }
        };

        const handleError = (error: unknown) => {
            logger.error('failed', { transactionId: transaction.id, errorMessage: getErrorMessage(error) });
            if (isActive) {
                setRefundsTotal(null);
            }
        };

        if (isRefund) {
            setRefundsTotal(null);
            void fetchRefundsTotal().catch(handleError);
        } else {
            setRefundsTotal(null);
        }

        return () => {
            isActive = false;
        };
    }, [isRefund, transaction.id]);

    const summary = isRefund && isDefined(refundsTotal) ? computeRefundedSummary(transaction, refundsTotal) : null;
    const currencySymbol = transaction.entries[0]?.account.instrument.symbol;

    if (!isDefined(summary)) {
        return null;
    }

    const formattedRefundedAmount =
        summary.kind === RefundedSummaryKindEnum.PARTIAL && isNotEmptyString(currencySymbol)
            ? formatDigits(convertFromMicroUnits(summary.refundsTotal), currencySymbol)
            : null;
    const label = isNotEmptyString(formattedRefundedAmount) ? t`Refunded ${formattedRefundedAmount}` : t`Refunded`;

    return <TransactionMetaPill label={label} icon={UserIconNameEnum.RotateCcw} onPress={onPress} testID={testID} />;
};
