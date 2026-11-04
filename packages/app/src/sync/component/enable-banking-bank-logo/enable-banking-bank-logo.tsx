import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly logoUrl: string | null;
    readonly name: string;
}

const LOGO_STYLE = { width: 36, height: 36, borderRadius: 10, borderCurve: 'continuous' } as const;

export const EnableBankingBankLogo = ({ logoUrl, name }: Props) => {
    const [hasFailed, setHasFailed] = useState(false);

    const handleError = () => {
        setHasFailed(true);
    };

    if (!isNotEmptyString(logoUrl) || hasFailed) {
        return (
            <View className="items-center justify-center bg-surface-disc" style={LOGO_STYLE}>
                <Text className="text-[17px] font-semibold text-primary">{name.trim().charAt(0).toLocaleUpperCase()}</Text>
            </View>
        );
    }

    const source = { uri: logoUrl };

    return <Image source={source} style={LOGO_STYLE} contentFit="contain" onError={handleError} />;
};
