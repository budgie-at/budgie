import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly title: string;
    readonly numberOfLines?: number;
}

export const GroupedListSectionTitle = ({ title, numberOfLines }: Props) => (
    <Text
        className="text-secondary-foreground px-3xl pb-md text-[15px] font-semibold"
        accessibilityRole="header"
        numberOfLines={numberOfLines}
        adjustsFontSizeToFit={isDefined(numberOfLines)}
        minimumFontScale={0.8}
    >
        {title}
    </Text>
);
