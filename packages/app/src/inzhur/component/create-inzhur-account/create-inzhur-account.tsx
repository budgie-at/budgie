import { ExternalSourceEnum } from '@budgie/contracts';
import { InzhurSetupService } from '@budgie/sync';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text, View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { FixedChromeHeader } from '../../../@generic/component/fixed-chrome-header/fixed-chrome-header';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { QuickFormLayout } from '../../../transaction/components/quick-form-layout/quick-form-layout';
import { TransactionAmountDisplay } from '../../../transaction/components/transaction-amount-display/transaction-amount-display';
import { TransactionKeypad } from '../../../transaction/components/transaction-keypad/transaction-keypad';
import { QuickFormHeroAlignmentEnum } from '../../../transaction/enum/quick-form-hero-alignment.enum';
import { useKeypadInput } from '../../../transaction/hook/use-keypad-input.hook';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const CreateInzhurAccount = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();
    const { displayValue, numericValue, handlers } = useKeypadInput();
    const hryvnia = useHryvniaInstrumentQuery();

    const handleGoBack = () => void goBackOrReplace('/');
    const handleAdd = () =>
        run(
            Effect.flatMap(InzhurSetupService, inzhurSetupService => inzhurSetupService.setup(numericValue)).pipe(
                toastOnFailure(t`Could not add Inzhur`)
            )
        );

    const hero = (
        <TransactionAmountDisplay
            amount={displayValue}
            currencySymbol={hryvnia?.symbol ?? ''}
            variant="primary"
            topContent={
                <View className="items-center gap-y-lg">
                    <View className="overflow-hidden rounded-[12px] dark:border dark:border-white/12">
                        <BankLogo bankProvider={ExternalSourceEnum.INZHUR} size={48} />
                    </View>
                    <Text className="text-[15px] font-medium text-secondary-foreground">
                        <Trans>Cash in Inzhur today</Trans>
                    </Text>
                </View>
            }
            testID={InzhurSelector.CashAmount}
        >
            <Text
                className="mt-lg max-w-[300px] text-center text-sm leading-[20px] text-secondary-foreground"
                lineBreakStrategyIOS="standard"
            >
                <Trans>Enter 0 if you have none. Your fund certificates are added when you import a statement.</Trans>
            </Text>
        </TransactionAmountDisplay>
    );
    const keypad = (
        <TransactionKeypad
            keypad={handlers}
            onConfirm={handleAdd}
            onCancel={handleGoBack}
            isConfirmDisabled={isLoading}
            confirmLabel={t`Continue`}
            confirmTestID={InzhurSelector.AddButton}
        />
    );

    return (
        <GroupedSurface testID={InzhurSelector.CreatePage}>
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <FixedChromeHeader title={t`Add Inzhur`} leading={<HeaderBackButton />} inFlow />
                    <View className="flex-1 px-5xl pb-safe">
                        <QuickFormLayout hero={hero} footer={keypad} heroAlignment={QuickFormHeroAlignmentEnum.CENTER} />
                    </View>
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
