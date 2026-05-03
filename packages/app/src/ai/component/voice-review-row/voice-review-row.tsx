import { CurrencyEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeInDown,
    FadeOut,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { VoiceReviewRowInterface } from '../../interface/voice-review-row.interface';

const SWIPE_THRESHOLD = 80;
const SWIPE_REVEAL = 96;
const ENTER_DELAY_PER_INDEX = 40;
const SWIPE_PAN_OFFSET = 12;
const SWIPE_PAN_OFFSET_NEG = -12;
const SWIPE_DELETE_TRANSLATE_X = -400;
const SWIPE_DELETE_DURATION_MS = 180;
const SPRING_DAMPING = 18;
const SPRING_STIFFNESS = 220;
const SPRING_CONFIG = { damping: SPRING_DAMPING, stiffness: SPRING_STIFFNESS } as const;
const ENTER_DURATION_MS = 220;
const EXIT_DURATION_MS = 180;
const TABULAR_NUMS_STYLE = { fontVariant: ['tabular-nums' as const] };

const VOICE_CURRENCY_SYMBOLS: Partial<Record<CurrencyEnum, string>> = {
    [CurrencyEnum.UAH]: '₴',
    [CurrencyEnum.USD]: '$',
    [CurrencyEnum.EUR]: '€'
};

interface Props {
    readonly row: VoiceReviewRowInterface;
    readonly index: number;
    readonly onEdit: (id: string, patch: Partial<Pick<VoiceReviewRowInterface, 'amountMicroUnits' | 'description'>>) => void;
    readonly onDelete: (id: string) => void;
}

const formatAmount = (amountMicroUnits: number): string => convertFromMicroUnits(amountMicroUnits).toFixed(0);

export const VoiceReviewRow = ({ row, index, onEdit, onDelete }: Props) => {
    const { t } = useLingui();
    const translateX = useSharedValue(0);

    const handleAmountChange = (text: string) => {
        const numeric = Number(text.replace(',', '.'));
        if (!Number.isFinite(numeric) || numeric < 0) {
            return;
        }
        onEdit(row.id, { amountMicroUnits: convertToMicroUnits(numeric) });
    };

    const handleDescriptionChange = (text: string) => {
        onEdit(row.id, { description: text });
    };

    const handleDeletePress = () => void onDelete(row.id);

    const swipeGesture = Gesture.Pan()
        .activeOffsetX([SWIPE_PAN_OFFSET_NEG, SWIPE_PAN_OFFSET])
        .failOffsetY([SWIPE_PAN_OFFSET_NEG, SWIPE_PAN_OFFSET])
        .onUpdate(event => {
            translateX.value = Math.min(0, Math.max(-SWIPE_REVEAL, event.translationX));
        })
        .onEnd(event => {
            if (event.translationX < -SWIPE_THRESHOLD) {
                translateX.value = withSpring(-SWIPE_REVEAL, SPRING_CONFIG);
            } else {
                translateX.value = withSpring(0, SPRING_CONFIG);
            }
        });

    const handleConfirmDelete = () => {
        translateX.value = withTiming(SWIPE_DELETE_TRANSLATE_X, { duration: SWIPE_DELETE_DURATION_MS }, finished => {
            if (finished === true) {
                runOnJS(handleDeletePress)();
            }
        });
    };

    const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
    const deleteStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [-SWIPE_REVEAL, -SWIPE_THRESHOLD / 2, 0], [1, 0.6, 0], 'clamp')
    }));

    const currencySymbol = isDefined(row.currency) ? (VOICE_CURRENCY_SYMBOLS[row.currency] ?? row.currency) : '·';

    return (
        <Animated.View
            entering={FadeInDown.delay(index * ENTER_DELAY_PER_INDEX).duration(ENTER_DURATION_MS)}
            exiting={FadeOut.duration(EXIT_DURATION_MS)}
        >
            <View className="relative">
                <Animated.View className="absolute inset-y-0 right-0 justify-center" style={deleteStyle}>
                    <Pressable
                        onPress={handleConfirmDelete}
                        accessibilityLabel={t`Delete`}
                        className="h-12 w-20 items-center justify-center rounded-2xl bg-destructive-background"
                    >
                        <Icon icon={UserIconNameEnum.Trash} className="text-destructive-foreground" />
                    </Pressable>
                </Animated.View>

                <GestureDetector gesture={swipeGesture}>
                    <Animated.View
                        style={cardStyle}
                        className="flex-row items-center gap-x-md rounded-2xl bg-secondary-background px-lg py-md"
                    >
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-background">
                            <Text className="text-lg font-semibold text-primary">{currencySymbol}</Text>
                        </View>

                        <TextInput
                            value={formatAmount(row.amountMicroUnits)}
                            onChangeText={handleAmountChange}
                            keyboardType="decimal-pad"
                            className="min-w-[64px] text-2xl font-semibold text-primary"
                            style={TABULAR_NUMS_STYLE}
                            selectTextOnFocus
                        />

                        <TextInput
                            value={row.description}
                            onChangeText={handleDescriptionChange}
                            placeholder={t`Description`}
                            className="flex-1 text-md text-secondary-foreground"
                            multiline={false}
                        />
                    </Animated.View>
                </GestureDetector>
            </View>
        </Animated.View>
    );
};
