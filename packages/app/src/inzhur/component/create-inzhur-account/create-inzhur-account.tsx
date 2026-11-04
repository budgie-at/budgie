import { ExternalSourceEnum } from '@budgie/contracts';
import { InzhurSetupService } from '@budgie/sync';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { CollapsibleChromeHeader } from '../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
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
    const { top } = useSafeAreaInsets();

    const contentStyle = { paddingTop: top + SCREEN_CHROME_CONTENT_INSET_TOP };
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
                    <BankLogo bankProvider={ExternalSourceEnum.INZHUR} size={48} />
                    <Text className="text-[15px] font-medium text-secondary-foreground">
                        <Trans>Opening Inzhur cash balance</Trans>
                    </Text>
                </View>
            }
            testID={InzhurSelector.CashAmount}
        >
            <Text
                className="mt-lg max-w-[300px] text-center text-sm leading-[20px] text-secondary-foreground"
                lineBreakStrategyIOS="standard"
            >
                <Trans>Enter 0 if you have no cash. Funds come from your statement.</Trans>
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
    const largeTitle = (
        <Text className="text-3xl font-medium text-primary" numberOfLines={1}>
            <Trans>Add Inzhur</Trans>
        </Text>
    );
    const smallTitle = (
        <Text className="text-center text-lg font-semibold text-primary" numberOfLines={1}>
            <Trans>Add Inzhur</Trans>
        </Text>
    );

    return (
        <GroupedSurface testID={InzhurSelector.CreatePage}>
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <View className="flex-1 px-5xl pb-safe" style={contentStyle}>
                        <QuickFormLayout hero={hero} footer={keypad} heroAlignment={QuickFormHeroAlignmentEnum.CENTER} />
                    </View>
                    <CollapsibleChromeHeader leading={<HeaderBackButton />} expandedTitle={largeTitle} collapsedTitle={smallTitle} />
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
