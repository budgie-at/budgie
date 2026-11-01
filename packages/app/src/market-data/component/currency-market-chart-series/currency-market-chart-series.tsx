import { G, Path } from 'react-native-svg';

import { isDefined } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';

interface Props {
    readonly clipPath: string;
    readonly linePath: string;
    readonly areaPath: string;
    readonly fill: string | null;
    readonly strokeClassName: string;
    readonly strokeWidth: number;
    readonly opacity: number;
}

export const CurrencyMarketChartSeries = ({ clipPath, linePath, areaPath, fill, strokeClassName, strokeWidth, opacity }: Props) => (
    <G clipPath={clipPath} opacity={opacity}>
        {isDefined(fill) ? <Path d={areaPath} fill={fill} /> : null}
        <StyledPath
            d={linePath}
            fill="none"
            strokeClassName={strokeClassName}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </G>
);
