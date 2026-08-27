import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollapsibleHeader } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';

interface Props {
    readonly expandedTitle: ReactNode;
    readonly collapsedTitle: ReactNode;
    readonly leading?: ReactNode;
    readonly trailing?: ReactNode;
    readonly testID?: string;
}

const HEADER_Z_INDEX = 3;
const HEADER_HORIZONTAL_PADDING = 16;
const HEADER_SLOT_SIZE = 44;
const TITLE_LAYER_HORIZONTAL_PADDING = 72;
const BACKGROUND_OPACITY_START_PROGRESS = 1;
const FLAT_TRANSLATE_Y = 0;
const NEUTRAL_SCALE = 1;

const collapsibleChromeHeaderStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        zIndex: HEADER_Z_INDEX
    },
    persistentRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: HEADER_HORIZONTAL_PADDING
    },
    slot: {
        minWidth: HEADER_SLOT_SIZE,
        minHeight: HEADER_SLOT_SIZE,
        alignItems: 'center',
        justifyContent: 'center'
    },
    titleLayer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: TITLE_LAYER_HORIZONTAL_PADDING
    },
    titleLayerContent: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export const CollapsibleChromeHeader = ({ expandedTitle, collapsedTitle, leading, trailing, testID }: Props): ReactNode => {
    const { config } = useScreenChrome();
    const insets = useSafeAreaInsets();

    const collapseDistance = config.collapseEnd - config.collapseStart;
    const expandedOpacityEndProgress = (config.largeTitleEnd - config.collapseStart) / collapseDistance;
    const collapsedOpacityStartProgress = (config.smallTitleStart - config.collapseStart) / collapseDistance;
    const titleCrossFadeMidpointProgress = (collapsedOpacityStartProgress + expandedOpacityEndProgress) / 2;
    const motion = {
        expandedOpacityEndProgress,
        collapsedOpacityStartProgress,
        backgroundOpacityStartProgress: BACKGROUND_OPACITY_START_PROGRESS,
        pointerEventsSwitchProgress: titleCrossFadeMidpointProgress,
        expandedTranslateY: FLAT_TRANSLATE_Y,
        expandedScale: NEUTRAL_SCALE,
        collapsedTranslateY: FLAT_TRANSLATE_Y
    };
    const containerStyle = [collapsibleChromeHeaderStyles.container, { paddingTop: insets.top }];
    const persistentContent = (
        <View style={collapsibleChromeHeaderStyles.persistentRow} pointerEvents="box-none">
            <View style={collapsibleChromeHeaderStyles.slot} pointerEvents="box-none">
                {leading}
            </View>
            <View style={collapsibleChromeHeaderStyles.slot} pointerEvents="box-none">
                {trailing}
            </View>
        </View>
    );
    const expandedContent = (
        <View style={collapsibleChromeHeaderStyles.titleLayerContent} pointerEvents="none">
            {expandedTitle}
        </View>
    );
    const collapsedContent = (
        <View style={collapsibleChromeHeaderStyles.titleLayerContent} pointerEvents="none">
            {collapsedTitle}
        </View>
    );

    return (
        <View style={containerStyle} pointerEvents="box-none">
            <CollapsibleHeader
                testID={testID}
                pointerEvents="box-none"
                snap={config.snapToCollapse}
                expandedHeight={config.headerHeight}
                collapsedHeight={config.headerHeight}
                collapseStart={config.collapseStart}
                collapseDistance={collapseDistance}
                expandedContent={expandedContent}
                collapsedContent={collapsedContent}
                persistentContent={persistentContent}
                motion={motion}
                expandedContentContainerStyle={collapsibleChromeHeaderStyles.titleLayer}
                collapsedContentContainerStyle={collapsibleChromeHeaderStyles.titleLayer}
            />
        </View>
    );
};
