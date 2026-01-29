import { isNotEmptyString } from '@rnw-community/shared';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface AccountDisplayInfo {
    readonly symbol: string;
    readonly code: string;
}

interface ConversionState {
    readonly isCrossCurrency: boolean;
    readonly destinationAmount: number;
    readonly exchangeRate: number;
    readonly isManualRate: boolean;
}

interface ComputeTransferDisplayParams {
    readonly isEditingDestination: boolean;
    readonly sourceDisplayValue: string;
    readonly sourceNumericValue: number;
    readonly destinationDisplayValue: string;
    readonly fromAccount: { instrument: Pick<InstrumentEntityInterface, 'symbol' | 'code'> } | null | undefined;
    readonly toAccount: { instrument: Pick<InstrumentEntityInterface, 'symbol' | 'code'> } | null | undefined;
    readonly defaultSymbol: string;
    readonly conversion: ConversionState;
    readonly sendingLabel: string;
    readonly receivingLabel: string;
}

interface ConversionRowDisplayProps {
    readonly destinationAmount: number;
    readonly destinationSymbol: string;
    readonly sourceCode: string;
    readonly destinationCode: string;
    readonly exchangeRate: number;
}

interface TransferDisplayResult {
    readonly displayAmount: string;
    readonly displaySymbol: string;
    readonly amountLabel: string | null;
    readonly secondaryAmountText: string | null;
    readonly conversionRowProps: ConversionRowDisplayProps;
}

const getAccountInfo = (
    account: { instrument: Pick<InstrumentEntityInterface, 'symbol' | 'code'> } | null | undefined,
    defaultSymbol: string
): AccountDisplayInfo => ({
    symbol: account?.instrument.symbol ?? defaultSymbol,
    code: account?.instrument.code ?? ''
});

// eslint-disable-next-line max-statements -- Display computation with multiple derived values
export const computeTransferDisplay = (params: ComputeTransferDisplayParams): TransferDisplayResult => {
    const {
        isEditingDestination,
        sourceDisplayValue,
        sourceNumericValue,
        destinationDisplayValue,
        fromAccount,
        toAccount,
        defaultSymbol,
        conversion,
        sendingLabel,
        receivingLabel
    } = params;

    const fromInfo = getAccountInfo(fromAccount, defaultSymbol);
    const toInfo = getAccountInfo(toAccount, defaultSymbol);

    const displayAmount = isEditingDestination ? destinationDisplayValue : sourceDisplayValue;
    const displaySymbol = isEditingDestination ? toInfo.symbol : fromInfo.symbol;

    const hasAccountCodes = isNotEmptyString(fromInfo.code) && isNotEmptyString(toInfo.code);
    const editingLabel = isEditingDestination ? receivingLabel : sendingLabel;
    const amountLabel = conversion.isCrossCurrency && hasAccountCodes ? editingLabel : null;

    const secondarySymbol = isEditingDestination ? fromInfo.symbol : toInfo.symbol;
    const secondaryValue = isEditingDestination ? sourceNumericValue : conversion.destinationAmount;
    const secondaryPrefix = isEditingDestination ? '' : '\u2248 ';
    const formattedSecondaryValue = secondaryValue > 0 ? secondaryValue.toFixed(2) : '0.00';
    const secondaryAmountText = conversion.isCrossCurrency ? `${secondaryPrefix}${secondarySymbol} ${formattedSecondaryValue}` : null;

    const conversionRowAmount = isEditingDestination ? sourceNumericValue : conversion.destinationAmount;
    const conversionRowSymbol = isEditingDestination ? fromInfo.symbol : toInfo.symbol;
    const conversionRowSourceCode = isEditingDestination ? toInfo.code : fromInfo.code;
    const conversionRowDestCode = isEditingDestination ? fromInfo.code : toInfo.code;
    const conversionRowRate = !isEditingDestination && conversion.exchangeRate > 0 ? 1 / conversion.exchangeRate : conversion.exchangeRate;

    return {
        displayAmount,
        displaySymbol,
        amountLabel,
        secondaryAmountText,
        conversionRowProps: {
            destinationAmount: conversionRowAmount,
            destinationSymbol: conversionRowSymbol,
            sourceCode: conversionRowSourceCode,
            destinationCode: conversionRowDestCode,
            exchangeRate: conversionRowRate
        }
    };
};
