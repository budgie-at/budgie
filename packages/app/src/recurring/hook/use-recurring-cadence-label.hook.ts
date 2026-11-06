import { RecurringCadenceUnitEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

const MONTHS_IN_QUARTER = 3;
const MONTHS_IN_YEAR = 12;

export const useRecurringCadenceLabel = () => {
    const { t } = useLingui();

    return (cadenceUnit: RecurringCadenceUnitEnum, cadenceInterval: number): string => {
        if (cadenceUnit === RecurringCadenceUnitEnum.WEEK) {
            return cadenceInterval === 1 ? t`Weekly` : t`Every ${cadenceInterval} weeks`;
        }

        if (cadenceUnit === RecurringCadenceUnitEnum.MONTH) {
            if (cadenceInterval === 1) {
                return t`Monthly`;
            }

            if (cadenceInterval === MONTHS_IN_QUARTER) {
                return t`Quarterly`;
            }

            return cadenceInterval === MONTHS_IN_YEAR ? t`Yearly` : t`Every ${cadenceInterval} months`;
        }

        return cadenceInterval === 1 ? t`Yearly` : t`Every ${cadenceInterval} years`;
    };
};
