import { UserIconNameEnum } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { FixedChromePage } from '../../../@generic/component/fixed-chrome-page/fixed-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { OperatedAtField } from '../../../@generic/component/operated-at-field/operated-at-field';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { DEFAULT_DECIMAL_PLACES } from '../../../i18n/constant/default-decimal-places.constant';
import { SecurityTradeFormSchema } from '../../constant/security-trade-form-schema.constant';
import { SecurityTradeSideEnum } from '../../enum/security-trade-side.enum';
import { InsufficientSecurityHoldingError } from '../../error/insufficient-security-holding.error';
import { BrokerageSelector } from '../../selector/brokerage.selector';
import { SecurityTradeNumberField } from '../security-trade-number-field/security-trade-number-field';
import { SecurityTradePriceHint } from '../security-trade-price-hint/security-trade-price-hint';
import { SecurityTradeQuantityHint } from '../security-trade-quantity-hint/security-trade-quantity-hint';
import { SecurityTradeSaveFooter } from '../security-trade-save-footer/security-trade-save-footer';

import type { AppServices } from '../../../@generic/runtime/app.runtime';
import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';
import type { useSecurityPriceQuery } from '../../query/use-security-price.query';
import type { ReactNode } from 'react';

interface Props<E> {
    readonly side: SecurityTradeSideEnum;
    readonly symbol: string;
    readonly currencySymbol: string;
    readonly maxQuantity: number | null;
    readonly suggestedPrice: ReturnType<typeof useSecurityPriceQuery>;
    readonly onSubmit: (values: SecurityTradeFormValues) => Effect.Effect<unknown, E, AppServices>;
    readonly children?: ReactNode;
}

const PRICE_MAX_DECIMALS = 4;

// eslint-disable-next-line max-lines-per-function -- Layout/form component requires many lines
export const SecurityTradeForm = <E,>(props: Props<E>) => {
    const { side, symbol, currencySymbol, maxQuantity, suggestedPrice, onSubmit, children } = props;
    const { t } = useLingui();
    const [operatedAt] = useState(() => new Date());
    const form = useForm<SecurityTradeFormValues>({
        mode: 'onChange',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(SecurityTradeFormSchema)),
        defaultValues: { quantity: 0, price: 0, fee: 0, operatedAt }
    });
    const { isLoading, run } = useSingleFlight();

    useEffect(() => {
        if (isPositiveNumber(suggestedPrice.price) && !form.getFieldState('price').isDirty) {
            form.setValue('price', suggestedPrice.price, { shouldValidate: true });
        }
    }, [form, suggestedPrice.price]);

    const handleSave = form.handleSubmit(values =>
        run(
            onSubmit(values).pipe(
                Effect.tap(() => Effect.sync(() => void goBackOrReplace('/'))),
                Effect.catchIf(Schema.is(InsufficientSecurityHoldingError), () =>
                    Effect.sync(
                        () => void form.setError('quantity', { type: 'server', message: t`Not enough shares held on the trade date` })
                    )
                ),
                toastOnFailure(t`Could not save the trade`)
            )
        )
    );

    const isReady = isNotEmptyString(symbol);
    const buyTitle = isReady ? t`Buy ${symbol}` : t`Add position`;
    const sellTitle = isReady ? t`Sell ${symbol}` : t`Sell`;
    const title = side === SecurityTradeSideEnum.BUY ? buyTitle : sellTitle;
    const priceFooter = (
        <SecurityTradePriceHint
            missingRateCurrency={suggestedPrice.missingRateCurrency}
            isUnavailable={suggestedPrice.isUnavailable}
            currencySymbol={currencySymbol}
        />
    );

    return (
        <GroupedSurface>
            <FormProvider {...form}>
                <FixedChromePage
                    title={title}
                    leading={<HeaderBackButton />}
                    testID={BrokerageSelector.TradePage}
                    footer={
                        <SecurityTradeSaveFooter
                            side={side}
                            currencySymbol={currencySymbol}
                            maxQuantity={maxQuantity}
                            isReady={isReady}
                            isLoading={isLoading}
                            onPress={handleSave}
                        />
                    }
                >
                    <FormLayoutGroup className="gap-y-[32px]">
                        {children}
                        <GroupedListSection footer={<SecurityTradeQuantityHint maxQuantity={maxQuantity} />}>
                            <SecurityTradeNumberField
                                name="quantity"
                                label={t`Shares`}
                                icon={UserIconNameEnum.Hash}
                                placeholder={t`Number of shares`}
                                testID={BrokerageSelector.QuantityInput}
                            />
                        </GroupedListSection>
                        <GroupedListSection footer={priceFooter}>
                            <SecurityTradeNumberField
                                name="price"
                                label={`${t`Price per share`} (${currencySymbol})`}
                                icon={UserIconNameEnum.Tag}
                                maxDecimals={PRICE_MAX_DECIMALS}
                                placeholder={t`Price per share`}
                                testID={BrokerageSelector.PriceInput}
                            />
                        </GroupedListSection>
                        <GroupedListSection>
                            <SecurityTradeNumberField
                                name="fee"
                                label={`${t`Fee`} (${currencySymbol})`}
                                icon={UserIconNameEnum.Receipt}
                                maxDecimals={DEFAULT_DECIMAL_PLACES}
                                placeholder={t`Optional`}
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
