import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';

import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { RevealGate } from '../../@generic/component/reveal-gate/reveal-gate';
import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { ScreenChromeThemeProvider } from '../../@generic/provider/screen-chrome-theme.provider';
import { YieldScreenContent } from '../../yield/component/yield-screen-content/yield-screen-content';
import { hasYieldAtom } from '../../yield/constant/has-yield-atom.constant';
import { useYieldScreenParams } from '../../yield/hook/use-yield-screen-params.hook';
import { useYieldScreenState } from '../../yield/hook/use-yield-screen-state.hook';
import { PassiveIncomeSelector } from '../../yield/selector/passive-income.selector';

export default function PassiveIncomeRoute() {
    const screenKey = useYieldScreenParams();
    const screenState = useYieldScreenState(screenKey);
    const hasYieldResult = useLiveAtomValue(hasYieldAtom);

    const hasYield = AsyncResult.getOrElse(hasYieldResult, () => true);

    return (
        <GroupedSurface testID={PassiveIncomeSelector.Page}>
            <RevealGate isLoading={AsyncResult.isInitial(hasYieldResult)}>
                <ScreenChromeThemeProvider>
                    <ScreenChromeFrame>
                        <YieldScreenContent state={screenState} hasYield={hasYield} />
                    </ScreenChromeFrame>
                </ScreenChromeThemeProvider>
            </RevealGate>
        </GroupedSurface>
    );
}
