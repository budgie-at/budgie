import { useEffect, useState } from 'react';
import { View, ViewProps } from 'react-native';

import { isDefined } from '@rnw-community/shared';

/** @deprecated https://github.com/nativewind/nativewind/issues/1647 */
const useFixNativewindInitialRenderBug = (style: ViewProps['style']) => {
    const [tempStyle, setTempStyle] = useState(style);

    useEffect(() => {
        // eslint-disable-next-line no-undefined,react-hooks/set-state-in-effect
        setTempStyle(undefined);
    }, []);

    return isDefined(tempStyle) && { style: tempStyle };
};

export const BottomTabs = ({ children, style, ...props }: ViewProps) => (
    <View
        {...props}
        {...useFixNativewindInitialRenderBug(style)}
        className="bg-primary-reverse flex-row justify-between border-t border-t-secondary-corner items-baseline pb-2 pl-4 pr-4"
    >
        {children}
    </View>
);
