import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';

import type { OnboardingReceiptRowInterface } from '../../interface/onboarding-receipt-row.interface';

interface Props {
    readonly rows: readonly OnboardingReceiptRowInterface[];
    readonly footer: string;
}

export const OnboardingReceiptSection = ({ rows, footer }: Props) => (
    <GroupedListSection footer={footer}>
        {rows.map(row => (
            <GroupedListRow
                key={row.label}
                title={row.label}
                right={
                    <Text className="max-w-[60%] shrink text-right text-[17px] text-secondary-foreground" numberOfLines={2}>
                        {row.value}
                    </Text>
                }
            />
        ))}
    </GroupedListSection>
);
