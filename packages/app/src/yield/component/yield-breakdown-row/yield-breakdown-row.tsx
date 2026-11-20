import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';

interface Props {
    readonly title: string;
    readonly value: string;
    readonly subtitle?: string;
    readonly testID: string;
}

export const YieldBreakdownRow = ({ title, value, subtitle, testID }: Props) => (
    <GroupedListRow
        title={title}
        subtitle={subtitle}
        testID={testID}
        right={
            <Text className="text-right text-[17px] font-semibold tabular-nums text-primary" maxFontSizeMultiplier={2}>
                {value}
            </Text>
        }
    />
);
