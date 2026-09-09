import { getLogger } from '@budgie/logger';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { useCurrencySelectorModal } from '../../../@generic/context/currency-selector-modal.context';
import { testID } from '../../../@generic/utils/test-id.util';
import { useSettingsContext } from '../../context/settings.context';
import { useSetting } from '../../hook/use-setting.hook';
import { onboardingService } from '../../service/onboarding.service';

import { OnboardingCurrencyStripSelector } from './onboarding-currency-strip.selector';

const logger = getLogger('OnboardingCurrencyStrip');

export const OnboardingCurrencyStrip = () => {
    const { t } = useLingui();
    const { defaultInstrument, defaultAccount } = useSettingsContext();
    const isOnboardingCompleted = useSetting('isOnboardingCompleted');
    const [openCurrencySelector] = useCurrencySelectorModal();
    const shouldCompleteRef = useRef(!isOnboardingCompleted);

    // oxlint-disable-next-line react/exhaustive-deps -- mount-only cleanup; the ref captures the value at mount
    useEffect(
        () => () => {
            if (shouldCompleteRef.current) {
                void onboardingService.complete().catch((error: unknown) => {
                    logger.error('complete failed', { errorMessage: getErrorMessage(error) });
                });
            }
        },
        []
    );

    if (isOnboardingCompleted) {
        return null;
    }

    const handleChange = async () => {
        const result = await openCurrencySelector({ selectedInstrumentId: defaultInstrument.id });

        if (isDefined(result) && isDefined(defaultAccount)) {
            await onboardingService.changeOnboardingCurrency(defaultAccount.id, result);
        }
    };

    const handleChangePress = () => void handleChange();
    const defaultInstrumentCode = defaultInstrument.code;
    const defaultAccountTitle = defaultAccount?.title;

    return (
        <View
            {...testID(OnboardingCurrencyStripSelector.Root)}
            className="flex-row items-center justify-between rounded-3xl border border-secondary-corner bg-secondary-background px-3xl py-lg mb-xl"
        >
            <Text className="text-secondary-foreground text-xs">
                <Trans>
                    Tracking in {defaultInstrumentCode} · {defaultAccountTitle}
                </Trans>
            </Text>

            <Pressable
                {...testID(OnboardingCurrencyStripSelector.ChangeButton)}
                onPress={handleChangePress}
                accessibilityLabel={t`Change currency`}
            >
                <Text className="text-primary text-xs font-semibold">
                    <Trans>Change</Trans>
                </Text>
            </Pressable>
        </View>
    );
};
