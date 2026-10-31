import { useState } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SELECTOR_HEADER_OFFSET } from '../../constant/selector-header-offset.constant';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly description: string | undefined;
    readonly children: (topOffset: number) => ReactNode;
}

const DESCRIPTION_STYLE = { top: SELECTOR_HEADER_OFFSET };

export const SelectorModalDescription = ({ description, children }: Props) => {
    const [descriptionHeight, setDescriptionHeight] = useState(0);

    if (!isNotEmptyString(description)) {
        return children(SELECTOR_HEADER_OFFSET);
    }

    const handleLayout = (event: LayoutChangeEvent) => void setDescriptionHeight(event.nativeEvent.layout.height);

    return (
        <>
            <View className="absolute inset-x-0 z-10 bg-primary-reverse px-3xl pb-md" style={DESCRIPTION_STYLE} onLayout={handleLayout}>
                <Text className="text-secondary-foreground text-[13px] leading-[18px]">{description}</Text>
            </View>
            {isPositiveNumber(descriptionHeight) ? children(SELECTOR_HEADER_OFFSET + descriptionHeight) : null}
        </>
    );
};
