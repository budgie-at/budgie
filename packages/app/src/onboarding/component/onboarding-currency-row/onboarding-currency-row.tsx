import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useCurrencySelectorModal } from '../../../@generic/context/currency-selector-modal.context';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';

import { OnboardingCurrencyRowSelector } from './onboarding-currency-row.selector';

export const OnboardingCurrencyRow = () => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const [openCurrencySelector] = useCurrencySelectorModal();

    const handleChangePress = () => {
        openCurrencySelector({ selectedInstrumentId: defaultInstrument.id }, result => {
            if (isDefined(result)) {
                appRuntime.runFork(logAndContinue(updateSettingsMutation({ defaultInstrumentId: result })));
            }
        });
    };

    const currencyName = defaultInstrument.name;
    const regionSubtitle = t`${currencyName} · from your region`;

    return (
        <View testID={OnboardingCurrencyRowSelector.Root}>
            <GroupedListSection>
                <GroupedListRow
                    testID={OnboardingCurrencyRowSelector.ChangeButton}
                    left={<GroupedListIcon icon={UserIconNameEnum.Coins} />}
                    title={t`Main currency`}
                    subtitle={regionSubtitle}
                    onPress={handleChangePress}
                />
            </GroupedListSection>
        </View>
    );
};
