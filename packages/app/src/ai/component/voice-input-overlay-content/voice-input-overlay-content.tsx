import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircularActionButton } from '../../../@generic/component/circular-action-button/circular-action-button';
import { VOICE_INPUT_STATE_TO_BUTTON } from '../../constant/voice-input-state-mapping.constant';
import { UseVoiceInputReturn } from '../../hook/use-voice-input.hook';
import { RecordButtonStateType } from '../../type/record-button-state-type.type';
import { AnimatedRecordButton } from '../animated-record-button/animated-record-button';
import { VoiceInputBubble } from '../voice-input-bubble/voice-input-bubble';
import { VoiceInputError } from '../voice-input-error/voice-input-error';

const MIC_BOTTOM_OFFSET = -16;
const CLOSE_BUTTON_ROTATION = 45;

interface Props {
    readonly voiceInput: UseVoiceInputReturn;
    readonly contentOpacity: SharedValue<number>;
    readonly onRecord: () => void;
    readonly onCancel: () => void;
}

export const VoiceInputOverlayContent = ({ voiceInput, contentOpacity, onRecord, onCancel }: Props) => {
    const { bottom } = useSafeAreaInsets();

    const contentAnimatedStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
    const closeButtonStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${CLOSE_BUTTON_ROTATION}deg` }] }));

    const buttonState: RecordButtonStateType = voiceInput.isReady ? VOICE_INPUT_STATE_TO_BUTTON[voiceInput.state] : 'loading';
    const showBubble = voiceInput.state === 'recording' || voiceInput.state === 'transcribing' || voiceInput.state === 'confirming';
    const hasError = voiceInput.state === 'error' && isNotEmptyString(voiceInput.data.error);
    const micContainerStyle = { paddingBottom: bottom + MIC_BOTTOM_OFFSET };
    const closeContainerStyle = { paddingBottom: bottom };

    return (
        <Animated.View className="absolute inset-0" style={contentAnimatedStyle} pointerEvents="box-none">
            {hasError && <VoiceInputError message={voiceInput.data.error} onDismiss={voiceInput.retry} />}

            <View className="absolute inset-x-0 bottom-0 items-center pb-lg" style={micContainerStyle} pointerEvents="box-none">
                <VoiceInputBubble
                    isVisible={showBubble}
                    committedText={voiceInput.data.transcription.committed}
                    partialText={voiceInput.data.transcription.partial}
                />
                <AnimatedRecordButton
                    state={buttonState}
                    audioLevel={voiceInput.data.audioLevel}
                    downloadProgress={voiceInput.downloadProgress}
                    onPress={onRecord}
                />
            </View>

            <View className="absolute right-0 bottom-0 px-lg" style={closeContainerStyle} pointerEvents="box-none">
                <CircularActionButton icon={UserIconNameEnum.Plus} onPress={onCancel} animatedStyle={closeButtonStyle} />
            </View>
        </Animated.View>
    );
};
