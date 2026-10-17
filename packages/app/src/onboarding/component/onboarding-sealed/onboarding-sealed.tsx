import { useState } from 'react';

import { OnboardingReceipt } from '../onboarding-receipt/onboarding-receipt';
import { OnboardingSealedMoment } from '../onboarding-sealed-moment/onboarding-sealed-moment';

export const OnboardingSealed = () => {
    const [isMomentVisible, setIsMomentVisible] = useState(true);

    const handleMomentContinue = () => void setIsMomentVisible(false);

    return isMomentVisible ? <OnboardingSealedMoment onContinue={handleMomentContinue} /> : <OnboardingReceipt />;
};
