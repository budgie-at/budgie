import { convertFromMicroUnits } from '@budgie/contracts';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { DepositDetailsRow } from '../../../account/component/deposit-details-row/deposit-details-row';

interface Props {
    readonly label: string;
    readonly microUnits: number;
    readonly instrumentSymbol: string;
}

export const InzhurFundReturnMoneyRow = ({ label, microUnits, instrumentSymbol }: Props) => (
    <DepositDetailsRow
        label={label}
        value={
            <ProtectedMoney instrumentSymbol={instrumentSymbol} className="font-semibold" fontSize={14} minFontSize={14} maxFontSize={14}>
                {convertFromMicroUnits(microUnits)}
            </ProtectedMoney>
        }
    />
);
