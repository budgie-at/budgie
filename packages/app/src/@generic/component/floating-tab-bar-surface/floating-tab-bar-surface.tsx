import { View } from 'react-native';

import { EdgeFade } from '@rnw-community/react-native-screen-chrome';

import { TabBarBackdropEnum } from '../../enum/tab-bar-backdrop.enum';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly backdrop: TabBarBackdropEnum;
}

const TAB_BAR_STYLE = { zIndex: 3 };

export const FloatingTabBarSurface = ({ children, backdrop }: Props) => {
    const isDefaultFade = backdrop === TabBarBackdropEnum.FADE;

    return (
        <>
            {isDefaultFade ? <EdgeFade position="bottom" /> : null}
            <View className="absolute inset-x-0 bottom-0 pt-md" pointerEvents="box-none" style={TAB_BAR_STYLE}>
                {isDefaultFade ? null : (
                    <View className="absolute inset-0 bg-grouped-surface" pointerEvents="none">
                        <View className="absolute inset-x-0 bottom-full h-[20px] bg-linear-to-b from-grouped-surface/0 to-grouped-surface" />
                    </View>
                )}
                <View className="flex-row items-center justify-between px-lg pb-safe">{children}</View>
            </View>
        </>
    );
};
