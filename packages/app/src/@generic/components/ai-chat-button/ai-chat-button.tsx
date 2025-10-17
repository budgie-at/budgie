import { ImpactFeedbackStyle } from 'expo-haptics';
import { Mic } from 'lucide-react-native';
import { useContext } from 'react';
import { Pressable, useColorScheme } from 'react-native';

import { ThemeContext } from '../../../theme/context/theme.context';
import { useVibration } from '../../hooks/use-vibration.hook';
import { useAiBottomSheetContext } from '../ai-bottom-sheet/ai-bottom-sheet';

import { AiChatButtonStyles } from './ai-chat-button.styles';

export const AiChatButton = () => {
    const [, hapticImpact] = useVibration();
    const scheme = useColorScheme();
    const { open } = useAiBottomSheetContext();
    const { theme } = useContext(ThemeContext);
    const bg = scheme === 'dark' ? '#ffffff' : '#000000';
    const color = scheme === 'dark' ? '#000000' : '#ffffff';
    console.log({ color, scheme });

    const styles = [AiChatButtonStyles.container, { backgroundColor: theme.colors.backgroundColor, shadowColor: theme.colors.black }];

    const openChatBottomSheet = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        open();
    };

    return (
        <Pressable onPress={openChatBottomSheet} style={styles}>
            <Mic color={color} size={16} />
        </Pressable>
    );
};
