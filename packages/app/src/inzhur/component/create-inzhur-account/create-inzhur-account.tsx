import { InzhurSetupService } from '@budgie/sync';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text, View } from 'react-native';

import { ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
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
                <Text className="text-[15px] font-medium text-secondary-foreground">
                    <Trans>Cash in your Inzhur app</Trans>
                </Text>
            }
            testID={InzhurSelector.CashAmount}
        >
            <Text
                className="mt-lg max-w-[300px] text-center text-sm leading-[20px] text-secondary-foreground"
                lineBreakStrategyIOS="standard"
            >
                <Trans>You can import a statement next.</Trans>
            </Text>
        </TransactionAmountDisplay>
    );
    const keypad = (
        <TransactionKeypad
            keypad={handlers}
            onConfirm={handleAdd}
            onCancel={handleGoBack}
            isConfirmDisabled={isLoading}
            confirmLabel={t`Add Inzhur`}
            confirmTestID={InzhurSelector.AddButton}
        />
    );

    return (
        <GroupedSurface testID={InzhurSelector.CreatePage}>
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <ScreenChromeHeader inFlow>
                        <View className="min-h-[52px] flex-row items-center px-xl">
                            <GoBackButton className="size-[44px] items-center justify-center p-0" onPress={handleGoBack} />
                            <Text className="flex-1 text-center text-[17px] font-semibold text-primary" accessibilityRole="header">
                                <Trans>Add Inzhur</Trans>
                            </Text>
                            <View className="size-[44px]" />
                        </View>
                    </ScreenChromeHeader>

                    <View className="flex-1 px-5xl pb-safe">
                        <QuickFormLayout hero={hero} footer={keypad} heroAlignment={QuickFormHeroAlignmentEnum.CENTER} />
                    </View>
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
