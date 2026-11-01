import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { defaultInstrumentAtom } from '../../constants/settings-atoms.constant';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsRow } from '../settings-row/settings-row';

const SAMPLE_AMOUNT = 1234.56;
const ISO_CURRENCY_CODE = /^[A-Z]{3}$/u;

export const ShowCentsRow = () => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const showCents = useSetting('showCents');
    const { code, symbol } = useAtomValue(defaultInstrumentAtom);

    const isIsoCurrency = ISO_CURRENCY_CODE.test(code);
    const format = (fractionDigits: number) =>
        isIsoCurrency
            ? intl.formatNumber(SAMPLE_AMOUNT, {
                  style: 'currency',
                  currency: code,
                  currencyDisplay: 'narrowSymbol',
                  minimumFractionDigits: fractionDigits,
                  maximumFractionDigits: fractionDigits
              })
            : `${symbol}${intl.formatNumber(SAMPLE_AMOUNT, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
    const withCents = format(2);
    const withoutCents = format(0);
    const centsExample = showCents ? t`${withCents} instead of ${withoutCents}` : t`${withoutCents} instead of ${withCents}`;
    const handleToggle = (checked: boolean) =>
        void appRuntime.runFork(
            logAndContinue(updateSettingsMutation({ showCents: checked }).pipe(toastOnFailure(t`Could not update settings`)))
        );
    const handlePress = () => void handleToggle(!showCents);

    return (
        <SettingsRow
            testID={SettingsPageSelector.ShowCentsCard}
            onPress={handlePress}
            title={t`Show cents`}
            subtitle={centsExample}
            icon={UserIconNameEnum.Coins}
            variant="ghost"
            right={
                <ThemedSwitch
                    testID={SettingsPageSelector.ShowCentsSwitch}
                    accessibilityLabel={t`Show cents`}
                    onValueChange={handleToggle}
                    value={showCents}
                />
            }
        />
    );
};
