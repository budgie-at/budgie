import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';

import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';

interface Props {
    readonly params: Pick<ConvertToInstallmentModalParamsInterface, 'amount' | 'instrumentSymbol' | 'operatedAt' | 'accountTitle'>;
}

export const ConvertToInstallmentSource = ({ params }: Props) => {
    const formatDigits = useFormatDigits(useAtomValue(decimalPlacesAtom));
    const { formatDayAndMonthAndYear } = useFormatDate();

    return (
        <Text className="text-sm text-secondary-foreground" numberOfLines={1}>
            {formatDayAndMonthAndYear(params.operatedAt)}
            {' · '}
            <ProtectedText className="tabular-nums">
                {formatDigits(convertFromMicroUnits(params.amount), params.instrumentSymbol)}
            </ProtectedText>
            {' · '}
            {params.accountTitle}
        </Text>
    );
};
