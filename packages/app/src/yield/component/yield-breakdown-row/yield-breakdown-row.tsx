import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { YIELD_BREAKDOWN_ROW_MIN_HEIGHT } from '../../constant/yield-breakdown-row-min-height.constant';

interface Props {
    readonly title: string;
    readonly value: string;
    readonly subtitle?: string;
    readonly testID: string;
}

const ROW_STYLE = { style: { minHeight: YIELD_BREAKDOWN_ROW_MIN_HEIGHT } };
const VALUE_CLASSNAME = 'text-right text-[17px] font-semibold tabular-nums text-primary';

export const YieldBreakdownRow = ({ title, value, subtitle, testID }: Props) => (
    <GroupedListRow
        title={title}
        subtitle={subtitle}
        testID={testID}
        pressableProps={ROW_STYLE}
        right={
            <Text className={VALUE_CLASSNAME} maxFontSizeMultiplier={2}>
                {value}
            </Text>
        }
    />
);
