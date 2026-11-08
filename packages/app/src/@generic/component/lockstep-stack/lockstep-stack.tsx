import { View, useWindowDimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { LockstepStackProvider } from '../../context/lockstep-stack.context';
import { useLockstepStackGesture } from '../../hook/use-lockstep-stack-gesture.hook';
import { useLockstepStack } from '../../hook/use-lockstep-stack.hook';
import { LockstepStackScreen } from '../lockstep-stack-screen/lockstep-stack-screen';

import type { ReactNode } from 'react';

interface Props {
    readonly root: ReactNode;
}

export const LockstepStack = ({ root }: Props) => {
    const { width } = useWindowDimensions();
    const { entries, isRootTop, canPop, position, topIndex, push, pop, handlePopped, handleScreenLayout } = useLockstepStack();
    const gesture = useLockstepStackGesture({ position, topIndex, width, isEnabled: canPop, onPopped: handlePopped });

    const actions = { push, pop };

    return (
        <LockstepStackProvider value={actions}>
            <GestureDetector gesture={gesture}>
                <View className="flex-1 overflow-hidden" collapsable={false}>
                    <LockstepStackScreen
                        index={0}
                        position={position}
                        width={width}
                        isTop={isRootTop}
                        isSettled
                        onScreenLayout={handleScreenLayout}
                    >
                        {root}
                    </LockstepStackScreen>

                    {entries.map(entry => (
                        <LockstepStackScreen
                            key={entry.key}
                            index={entry.index}
                            position={position}
                            width={width}
                            isTop={entry.isTop}
                            isSettled={entry.isSettled}
                            onScreenLayout={handleScreenLayout}
                        >
                            {entry.content}
                        </LockstepStackScreen>
                    ))}
                </View>
            </GestureDetector>
        </LockstepStackProvider>
    );
};
