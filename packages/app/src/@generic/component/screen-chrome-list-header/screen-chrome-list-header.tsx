import { isValidElement } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import type { LegendListProps } from '@legendapp/list/react-native';

interface Props {
    readonly header: LegendListProps<unknown>['ListHeaderComponent'];
    readonly minimumHeight: number;
}

export const ScreenChromeListHeader = ({ header, minimumHeight }: Props) => {
    const style = { minHeight: minimumHeight };

    if (isValidElement(header)) {
        return <View style={style}>{header}</View>;
    }

    const HeaderComponent = header;
    const content = isDefined(HeaderComponent) ? <HeaderComponent /> : null;

    return <View style={style}>{content}</View>;
};
