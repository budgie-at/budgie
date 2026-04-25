import { Directions, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface Params<T extends string> {
    readonly tabs: readonly T[];
    readonly activeTab: T;
    readonly onChangeTab: (tab: T) => void;
}

export const useTabSwipeGesture = <T extends string>({ tabs, activeTab, onChangeTab }: Params<T>) => {
    const handleSwipeLeft = () => {
        const index = tabs.indexOf(activeTab);
        if (index < tabs.length - 1) {
            onChangeTab(tabs[index + 1]);
        }
    };

    const handleSwipeRight = () => {
        const index = tabs.indexOf(activeTab);
        if (index > 0) {
            onChangeTab(tabs[index - 1]);
        }
    };

    const swipeLeft = Gesture.Fling()
        .direction(Directions.LEFT)
        .onEnd(() => void runOnJS(handleSwipeLeft)());
    const swipeRight = Gesture.Fling()
        .direction(Directions.RIGHT)
        .onEnd(() => void runOnJS(handleSwipeRight)());

    return Gesture.Race(swipeLeft, swipeRight);
};
