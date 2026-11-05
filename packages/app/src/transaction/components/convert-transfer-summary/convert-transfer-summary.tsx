import { InstrumentTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { ConvertToTransferModalSelector } from '../../../app/convert-to-transfer-modal.selector';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useConvertToTransferModalParams } from '../../hook/use-convert-to-transfer-modal-params.hook';

export const ConvertTransferSummary = () => {
    const { t } = useLingui();
    const params = useConvertToTransferModalParams();
    const { account } = useGetAccountByIdQuery(params?.excludeAccountId ?? 0);
    const formatAmount = useFormatDigits(2, account?.instrument.type === InstrumentTypeEnum.CRYPTO ? MICRO_UNIT_DECIMAL_PLACES : 2);
    const isProtected = useIsAmountProtected();
    const amount = isProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatAmount(params?.sourceAmount ?? 0, account?.instrument.symbol);
    const accountTitle = account?.title ?? '';
    const accountLabel = params?.transactionType === TransactionTypeEnum.EXPENSE ? t`From ${accountTitle}` : t`To ${accountTitle}`;

    return (
        <View className="items-center gap-y-[6px] px-xl pb-[12px]">
            <Text
                className="text-primary text-center text-[36px] leading-[44px] font-semibold tabular-nums"
                maxFontSizeMultiplier={1.35}
                testID={ConvertToTransferModalSelector.OriginalAmount}
                adjustsFontSizeToFit
                numberOfLines={1}
            >
                {amount}
            </Text>
            <Text className="text-secondary-foreground text-center text-[15px] leading-[20px]" maxFontSizeMultiplier={1.5}>
                {accountLabel}
            </Text>
        </View>
    );
};
