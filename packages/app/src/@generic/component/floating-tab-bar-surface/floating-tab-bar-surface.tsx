import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EdgeFade } from '@rnw-community/react-native-screen-chrome';

import { FLOATING_TAB_BAR_HEIGHT } from '../../constant/floating-tab-bar.constant';
import { SCREEN_CHROME_EDGE_RAMP_LENGTH } from '../../constant/screen-chrome-config.constant';
import { TabBarBackdropEnum } from '../../enum/tab-bar-backdrop.enum';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly backdrop: TabBarBackdropEnum;
}

const TAB_BAR_STYLE = { zIndex: 3 };

export const FloatingTabBarSurface = ({ children, backdrop }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const [height, setHeight] = useState(FLOATING_TAB_BAR_HEIGHT + bottom);
    const fadeHeight = Math.max(0, height - bottom) + SCREEN_CHROME_EDGE_RAMP_LENGTH;
    const isDefaultFade = backdrop === TabBarBackdropEnum.FADE;
    const handleLayout = (event: LayoutChangeEvent) => {
        setHeight(event.nativeEvent.layout.height);
    };

    return (
        <>
            {isDefaultFade ? <EdgeFade position="bottom" height={fadeHeight} /> : null}
            <View className="absolute inset-x-0 bottom-0 pt-md" pointerEvents="box-none" style={TAB_BAR_STYLE}>
                {isDefaultFade ? null : (
                    <View className="absolute inset-0 bg-grouped-surface" pointerEvents="none">
                        <View className="absolute inset-x-0 bottom-full h-[20px] bg-linear-to-b from-grouped-surface/0 to-grouped-surface" />
                    </View>
                )}
                <View className="flex-row items-center justify-between px-lg pb-safe" onLayout={handleLayout}>
                    {children}
                </View>
            </View>
        </>
    );
};
