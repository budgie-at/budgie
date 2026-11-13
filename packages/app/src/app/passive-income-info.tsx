import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { goBackOrReplace } from '../@generic/utils/go-back-or-replace.util';
import { YieldInfoSheetContent } from '../yield/component/yield-info-sheet-content/yield-info-sheet-content';
import { useYieldScreenParams } from '../yield/hook/use-yield-screen-params.hook';

export default function PassiveIncomeInfoRoute() {
    const screenKey = useYieldScreenParams();

    const handleDismissed = () => void goBackOrReplace('/passive-income');

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <YieldInfoSheetContent screenKey={screenKey} />
        </SingleStepMorphingSheet>
    );
}
