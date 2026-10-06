import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';

interface Props {
    readonly params: Pick<ConvertToInstallmentModalParamsInterface, 'amount' | 'instrumentSymbol'>;
}

export const ConvertToInstallmentParts = ({ params }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const { control } = useFormContext<ConvertToInstallmentFormValues>();
    const [installmentCount, totalAmount] = useWatch({ control, name: ['installmentCount', 'totalAmount'] });

    const isEqualParts = convertToMicroUnits(totalAmount) === params.amount * installmentCount;
    const partAmount = isEqualParts ? convertFromMicroUnits(params.amount) : totalAmount / installmentCount;
    const formattedPartAmount = formatDigits(partAmount, params.instrumentSymbol);
    const partsLabel = isEqualParts ? `${installmentCount} × ${formattedPartAmount}` : t`≈ ${formattedPartAmount} per payment`;

    return (
        <ProtectedText
            className="text-md font-medium text-secondary-foreground tabular-nums"
            testID={ConvertToInstallmentModalSelector.PartsLabel}
        >
            {partsLabel}
        </ProtectedText>
    );
};
