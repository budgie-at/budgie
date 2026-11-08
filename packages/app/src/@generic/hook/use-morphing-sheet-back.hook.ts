import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import type { useMorphingSheetMotion } from './use-morphing-sheet-motion.hook';

export const useMorphingSheetBack = (
    stepBack: (() => void) | undefined,
    motion: Pick<ReturnType<typeof useMorphingSheetMotion>, 'isDismissing' | 'handleDismiss' | 'handleSettle' | 'handleSwipeDismiss'>
) => {
    const { t } = useLingui();

    const handleBack = () => {
        if (isDefined(stepBack) && !motion.isDismissing.get()) {
            stepBack();
        } else {
            motion.handleDismiss();
        }
    };

    const handleSwipeBack = (velocity: number) => {
        if (isDefined(stepBack)) {
            motion.handleSettle(velocity);
            stepBack();
        } else {
            motion.handleSwipeDismiss(velocity);
        }
    };

    return { label: isDefined(stepBack) ? t`Back` : t`Close`, handleBack, handleSwipeBack };
};
