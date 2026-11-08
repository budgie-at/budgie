import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly text: string;
}

export const VoiceReviewTranscript = ({ text }: Props) => {
    if (!isNotEmptyString(text)) {
        return null;
    }

    return (
        <View className="mt-xl px-xl py-lg">
            <Text className="text-md leading-relaxed text-secondary-foreground" selectable>
                {text}
            </Text>
        </View>
    );
};
