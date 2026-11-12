import { UserIconNameEnum } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FixedChromePage } from '../../../@generic/component/fixed-chrome-page/fixed-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { OperatedAtField } from '../../../@generic/component/operated-at-field/operated-at-field';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SecurityTradeFormSchema } from '../../constant/security-trade-form-schema.constant';
import { InsufficientSecurityHoldingError } from '../../error/insufficient-security-holding.error';
import { BrokerageSelector } from '../../selector/brokerage.selector';
import { SecurityTradeNumberField } from '../security-trade-number-field/security-trade-number-field';

import type { AppServices } from '../../../@generic/runtime/app.runtime';
import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';
import type { ReactNode } from 'react';

interface Props<E> {
    readonly title: string;
    readonly currencySymbol: string;
    readonly isReady: boolean;
    readonly onSubmit: (values: SecurityTradeFormValues) => Effect.Effect<unknown, E, AppServices>;
    readonly children?: ReactNode;
}

export const SecurityTradeForm = <E,>({ title, currencySymbol, isReady, onSubmit, children }: Props<E>) => {
    const { t } = useLingui();
    const [operatedAt] = useState(() => new Date());
    const form = useForm<SecurityTradeFormValues>({
        mode: 'onChange',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(SecurityTradeFormSchema)),
        defaultValues: { quantity: 0, price: 0, fee: 0, operatedAt }
    });
    const { isLoading, run } = useSingleFlight();

    const handleSave = form.handleSubmit(values =>
        run(
            onSubmit(values).pipe(
                Effect.tap(() => Effect.sync(() => void goBackOrReplace('/'))),
                Effect.catchIf(Schema.is(InsufficientSecurityHoldingError), () =>
                    Effect.sync(() => void showErrorToast(t`Could not save the trade`, t`Not enough shares held on the trade date`))
                ),
                toastOnFailure(t`Could not save the trade`)
            )
        )
    );

    const isSaveDisabled = !isReady || !form.formState.isValid;

    return (
        <GroupedSurface>
            <FormProvider {...form}>
                <FixedChromePage
                    title={title}
                    leading={<HeaderBackButton />}
                    testID={BrokerageSelector.TradePage}
                    footer={
                        <PillButtonFooter
                            label={t`Save`}
                            onPress={handleSave}
                            isLoading={isLoading}
                            isDisabled={isSaveDisabled}
                            testID={BrokerageSelector.SaveButton}
                        />
                    }
                >
                    <FormLayoutGroup className="gap-y-[32px]">
                        {children}
                        <GroupedListSection>
                            <SecurityTradeNumberField
                                name="quantity"
                                label={t`Shares`}
                                icon={UserIconNameEnum.Hash}
                                testID={BrokerageSelector.QuantityInput}
                            />
                            <SecurityTradeNumberField
                                name="price"
                                label={`${t`Price per share`} (${currencySymbol})`}
                                icon={UserIconNameEnum.Tag}
                                testID={BrokerageSelector.PriceInput}
                            />
                            <SecurityTradeNumberField
                                name="fee"
                                label={`${t`Fee`} (${currencySymbol})`}
                                icon={UserIconNameEnum.Receipt}
                                testID={BrokerageSelector.FeeInput}
                            />
                        </GroupedListSection>
                        <OperatedAtField testID={BrokerageSelector.DateButton} />
                    </FormLayoutGroup>
                </FixedChromePage>
            </FormProvider>
        </GroupedSurface>
    );
};
