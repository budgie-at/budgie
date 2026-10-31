import { View } from 'react-native';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';

import { CategorizeInboxCtaButton } from '../categorize-inbox-cta-button/categorize-inbox-cta-button';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly onPress: () => void;
}

const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;

export const CategorizeInboxPrimaryBar = ({ label, testID, onPress }: Props) => (
    <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS}>
        <View className="border-t-hairline border-surface-separator bg-surface px-5xl pb-safe pt-lg">
            <CategorizeInboxCtaButton label={label} testID={testID} onPress={onPress} />
        </View>
    </ScreenChromeFooter>
);
