import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly valueClassName: string;
    readonly testID: string;
    readonly subtitle?: string;
}

export const CurrencyMarketPositionRow = ({ label, value, valueClassName, testID, subtitle }: Props) => (
    <GroupedListRow
        title={label}
        subtitle={subtitle}
        testID={testID}
        right={
            <ProtectedText
                selectable
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                numberOfLines={1}
                className={cn('max-w-[62%] text-right text-[17px] tabular-nums', valueClassName)}
            >
                {value}
            </ProtectedText>
        }
    />
);
