import { ExternalSourceEnum } from '@budgie/contracts';
import { InzhurSetupService } from '@budgie/sync';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text, View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isPositiveNumber } from '@rnw-community/shared';

import { FixedChromeHeader } from '../../../@generic/component/fixed-chrome-header/fixed-chrome-header';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { InstitutionMark } from '../../../account/component/institution-mark/institution-mark';
import { QuickFormLayout } from '../../../transaction/components/quick-form-layout/quick-form-layout';
import { TransactionAmountDisplay } from '../../../transaction/components/transaction-amount-display/transaction-amount-display';
import { TransactionFormActions } from '../../../transaction/components/transaction-form-actions/transaction-form-actions';
import { TransactionKeypad } from '../../../transaction/components/transaction-keypad/transaction-keypad';
import { useKeypadInput } from '../../../transaction/hook/use-keypad-input.hook';
import { useTransactionKeypadEditing } from '../../../transaction/hook/use-transaction-keypad-editing.hook';
import { inzhurLinkedPaymentsAtom } from '../../constant/inzhur-linked-payments-atom.constant';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const CreateInzhurAccount = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();
    const { displayValue, numericValue, handlers } = useKeypadInput();
    const { footerHeight } = useTransactionKeypadEditing(true);
    const hryvnia = useHryvniaInstrumentQuery();
    const setLinkedPayments = useAtomSet(inzhurLinkedPaymentsAtom);
    const amountVariant = isPositiveNumber(numericValue) ? 'primary' : 'secondary';

    const handleGoBack = () => void goBackOrReplace('/');
    const handleAdd = () =>
        run(
            Effect.flatMap(InzhurSetupService, inzhurSetupService => inzhurSetupService.setup(numericValue)).pipe(
                Effect.tap(({ linked }) =>
                    Effect.sync(() => void setLinkedPayments(linked.topUps + linked.withdrawals + linked.dividends))
                ),
                toastOnFailure(t`Could not add Inzhur`)
            )
        );

    const amount = (
        <TransactionAmountDisplay
            amount={displayValue}
            currencySymbol={hryvnia?.symbol ?? ''}
            variant={amountVariant}
            testID={InzhurSelector.CashAmount}
        />
    );
    const context = (
        <View className="items-center gap-y-lg">
            <InstitutionMark provider={ExternalSourceEnum.INZHUR} title={t`Inzhur`} />
            <Text className="text-[15px] font-medium text-secondary-foreground">
                <Trans>Inzhur cash</Trans>
            </Text>
            <Text className="max-w-[300px] text-center text-sm leading-[20px] text-secondary-foreground" lineBreakStrategyIOS="standard">
                <Trans>Money not yet invested in a fund. Certificates are added from your first statement.</Trans>
            </Text>
        </View>
    );
    const footer = (
        <TransactionFormActions
            label={t`Continue`}
            isDisabled={isLoading}
            onConfirm={handleAdd}
            onCancel={handleGoBack}
            testID={InzhurSelector.AddButton}
        >
            <TransactionKeypad keypad={handlers} />
        </TransactionFormActions>
    );

    return (
        <GroupedSurface testID={InzhurSelector.CreatePage}>
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <FixedChromeHeader title={t`Add Inzhur`} leading={<HeaderBackButton />} inFlow />
                    <View className="flex-1 px-5xl pb-safe">
                        <QuickFormLayout amount={amount} context={context} footer={footer} footerHeight={footerHeight} />
                    </View>
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
