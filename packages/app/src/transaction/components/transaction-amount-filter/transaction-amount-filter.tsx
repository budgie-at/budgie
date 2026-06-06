import { AmountRangeInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useTransactionAmountFilterModal } from '../../context/transaction-amount-filter-modal.context';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

interface Props {
    readonly value: AmountRangeInterface | null;
    readonly onChange: (value: AmountRangeInterface | null) => void;
}

export const TransactionAmountFilter = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const [openTransactionAmountFilter] = useTransactionAmountFilterModal();

    const handleOpen = async () => {
        const result = await openTransactionAmountFilter({ value });

        if (isDefined(result)) {
            onChange(result.value);
        }
    };

    const fromAmount = value?.from ?? null;
    const toAmount = value?.to ?? null;
    const hasAmountFilterSelected = isDefined(fromAmount) || isDefined(toAmount);

    const getLabel = () => {
        const fromText = isDefined(fromAmount) ? formatDigits(fromAmount, defaultInstrument.symbol) : null;
        const toText = isDefined(toAmount) ? formatDigits(toAmount, defaultInstrument.symbol) : null;

        if (isDefined(fromText) && isDefined(toText)) {
            return `${fromText} – ${toText}`;
        }

        if (isDefined(fromText)) {
            return t`From ${fromText}`;
        }

        if (isDefined(toText)) {
            return t`To ${toText}`;
        }

        return t`Amount`;
    };

    const label = getLabel();
    const chipTestID = hasAmountFilterSelected ? TransactionFiltersSelector.AmountChipActive : TransactionFiltersSelector.AmountChip;

    return (
        <TransactionFilterChip
            isActive={hasAmountFilterSelected}
            icon={UserIconNameEnum.Coins}
            label={label}
            onPress={handleOpen}
            testID={chipTestID}
        />
    );
};
