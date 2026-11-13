import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChrome, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationSyncsQuery } from '../../query/use-bank-integration-syncs.query';
import { BankIntegrationStatusLine } from '../bank-integration-status-line/bank-integration-status-line';

export const BankIntegrationOverview = () => {
    const { integration, capabilities } = useBankIntegration();
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const reducedMotion = useReducedMotion();
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: reducedMotion
            ? Number(scrollY.get() < config.smallTitleStart)
            : interpolate(scrollY.get(), [config.collapseStart, config.smallTitleStart], [1, 0], Extrapolation.CLAMP)
    }));
    const syncs = useBankIntegrationSyncsQuery(integration.id);
    const statusLine =
        capabilities.supportsLiveSync || capabilities.supportsFileImport ? <BankIntegrationStatusLine syncs={syncs} /> : null;

    return (
        <Animated.View style={animatedStyle} className="items-center gap-y-[8px] py-xl" testID={BankIntegrationSelector.Overview}>
            <BankLogo bankProvider={integration.provider} size={56} bankName={integration.label} />
            {statusLine}
        </Animated.View>
    );
};
