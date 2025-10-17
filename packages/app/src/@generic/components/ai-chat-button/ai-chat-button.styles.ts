import { StyleSheet } from 'react-native';

const AI_BUTTON_SIZE = 64;

export const AiChatButtonStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        aspectRatio: 1,
        borderRadius: '50%',
        height: AI_BUTTON_SIZE,
        justifyContent: 'center',
        margin: 'auto',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        transform: [{ translateY: -40 }],
        width: AI_BUTTON_SIZE
    }
});
