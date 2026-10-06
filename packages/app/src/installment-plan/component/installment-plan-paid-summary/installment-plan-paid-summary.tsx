import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useInstallmentPlanScheduleQuery } from '../../query/use-installment-plan-schedule.query';

interface Props {
    readonly accountId: number;
    readonly instrumentSymbol: string;
}

export const InstallmentPlanPaidSummary = ({ accountId, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const schedule = useInstallmentPlanScheduleQuery(accountId);

    if (!isDefined(schedule)) {
        return null;
    }

    const { paidCount, installmentCount } = schedule;
    const paidAmount = formatDigits(convertFromMicroUnits(schedule.paidAmount), instrumentSymbol);

    return (
        <ProtectedText className="pt-lg text-center text-sm text-secondary-foreground tabular-nums">
            {t`Paid ${paidAmount} · ${paidCount} of ${installmentCount}`}
        </ProtectedText>
    );
};
