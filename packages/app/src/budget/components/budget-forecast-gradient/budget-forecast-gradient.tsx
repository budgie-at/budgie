import { Defs, LinearGradient } from 'react-native-svg';

import { StyledStop } from '../../../@generic/component/styled-stop/styled-stop';

interface Props {
    readonly id: string;
    readonly accentClassName: string;
}

export const BudgetForecastGradient = ({ id, accentClassName }: Props) => (
    <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <StyledStop offset="0" stopClassName={accentClassName} stopOpacity={0.28} />
            <StyledStop offset="1" stopClassName={accentClassName} stopOpacity={0} />
        </LinearGradient>
    </Defs>
);
