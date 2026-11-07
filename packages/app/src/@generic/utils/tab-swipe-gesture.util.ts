import { Directions, Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

interface Params<T extends string> {
    readonly tabs: readonly T[];
    readonly activeTab: T;
    readonly onChangeTab: (tab: T) => void;
    readonly onSwipeChange: () => void;
}

export const tabSwipeGesture = <T extends string>({ tabs, activeTab, onChangeTab, onSwipeChange }: Params<T>) => {
    const handleSwipeLeft = () => {
        const index = tabs.indexOf(activeTab);
        if (index < tabs.length - 1) {
            onSwipeChange();
            onChangeTab(tabs[index + 1]);
        }
    };

    const handleSwipeRight = () => {
        const index = tabs.indexOf(activeTab);
        if (index > 0) {
            onSwipeChange();
            onChangeTab(tabs[index - 1]);
        }
    };

    const swipeLeft = Gesture.Fling()
        .direction(Directions.LEFT)
        .onEnd(() => void scheduleOnRN(handleSwipeLeft));
    const swipeRight = Gesture.Fling()
        .direction(Directions.RIGHT)
        .onEnd(() => void scheduleOnRN(handleSwipeRight));

    return Gesture.Race(swipeLeft, swipeRight);
};
