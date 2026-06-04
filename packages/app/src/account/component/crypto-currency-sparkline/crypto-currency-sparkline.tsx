import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const CryptoCurrencySparkline = () => (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 320 120" preserveAspectRatio="none">
            <Path
                d="M0 96 C22 88 28 58 48 64 C68 70 70 32 92 38 C116 44 112 84 138 76 C164 68 164 42 190 44 C216 46 216 78 242 66 C268 54 272 18 320 26"
                stroke="#facc15"
                strokeOpacity={0.24}
                strokeWidth={2}
                fill="none"
            />
            <Path
                d="M0 120 L0 96 C22 88 28 58 48 64 C68 70 70 32 92 38 C116 44 112 84 138 76 C164 68 164 42 190 44 C216 46 216 78 242 66 C268 54 272 18 320 26 L320 120 Z"
                fill="#facc15"
                fillOpacity={0.05}
            />
        </Svg>
    </View>
);
