import { StyleSheet, View } from 'react-native';

import { CollapsibleHeader } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

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
    },
    expandedTitleLayerContent: {
        alignSelf: 'stretch',
        justifyContent: 'center'
    }
});

export const CollapsibleChromeHeader = ({ expandedTitle, collapsedTitle, leading, trailing, testID }: Props): ReactNode => {
    const { config } = useScreenChrome();

    const collapseDistance = config.collapseEnd - config.collapseStart;
    const motion = {
        expandedOpacityEndProgress: (config.largeTitleEnd - config.collapseStart) / collapseDistance,
        collapsedOpacityStartProgress: (config.smallTitleStart - config.collapseStart) / collapseDistance,
        backgroundOpacityStartProgress: BACKGROUND_OPACITY_START_PROGRESS,
        expandedTranslateY: FLAT_TRANSLATE_Y,
        expandedScale: NEUTRAL_SCALE,
        collapsedTranslateY: FLAT_TRANSLATE_Y
    };
    const leadingSlotWidth = isDefined(leading) ? HEADER_SLOT_SIZE : 0;
    const trailingSlotWidth = isDefined(trailing) ? HEADER_SLOT_SIZE : 0;
    const expandedContentContainerStyle = [
        collapsibleChromeHeaderStyles.titleLayer,
        {
            paddingLeft: HEADER_HORIZONTAL_PADDING + leadingSlotWidth,
            paddingRight: HEADER_HORIZONTAL_PADDING + trailingSlotWidth
        }
    ];
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
        <View style={collapsibleChromeHeaderStyles.expandedTitleLayerContent} pointerEvents="none">
            {expandedTitle}
        </View>
    );
    const collapsedContent = (
        <View style={collapsibleChromeHeaderStyles.titleLayerContent} pointerEvents="none">
            {collapsedTitle}
        </View>
    );

    return (
        <View className="pt-safe" style={collapsibleChromeHeaderStyles.container} pointerEvents="box-none">
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
                expandedContentContainerStyle={expandedContentContainerStyle}
                collapsedContentContainerStyle={collapsibleChromeHeaderStyles.titleLayer}
            />
        </View>
    );
};
