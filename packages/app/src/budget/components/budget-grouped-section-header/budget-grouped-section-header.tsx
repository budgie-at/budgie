import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly trailing?: ReactNode;
    readonly testID?: string;
}

export const BudgetGroupedSectionHeader = ({ label, trailing, testID }: Props) => {
    const containerClassName = useIsLargeTextSize()
        ? 'items-start gap-y-xxs'
        : 'min-h-[44px] flex-row items-center justify-between gap-x-md';

    return (
        <View testID={testID} collapsable={false} className={containerClassName}>
            <View className="min-w-0 shrink self-stretch">
                <GroupedListSectionTitle title={label} numberOfLines={2} />
            </View>
            {isDefined(trailing) ? <View className="min-h-[44px] shrink-0 justify-center px-3xl">{trailing}</View> : null}
        </View>
    );
};
