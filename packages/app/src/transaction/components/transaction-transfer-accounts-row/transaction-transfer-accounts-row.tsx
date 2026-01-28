import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useImperativeHandle } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { TransferAccountPicker } from '../transfer-account-picker/transfer-account-picker';

const ANIMATION_DELAY = 170;

export interface TransactionTransferAccountsRowRef {
    shakeFrom: () => void;
    shakeTo: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionTransferAccountsRowRef | null>;
    readonly variant: ColorPaletteVariant;
}

export const TransactionTransferAccountsRow = ({ ref, variant }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const { openAccountSelector } = useAccountSelectorModal();
    const { shake: shakeFrom, animatedStyle: fromAnimatedStyle } = useShakeAnimation();
    const { shake: shakeTo, animatedStyle: toAnimatedStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shakeFrom, shakeTo }));

    const fromAccountId = useWatch({ control, name: 'fromAccountId' });
    const toAccountId = useWatch({ control, name: 'toAccountId' });

    const { account: fromAccount } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { account: toAccount } = useGetAccountByIdQuery(toAccountId ?? 0);

    const handleFromPress = async () => {
        const selectedAccountId = await openAccountSelector({
            initialAccountId: fromAccountId,
            excludeAccountId: toAccountId
        });

        if (isDefined(selectedAccountId)) {
            setValue('fromAccountId', selectedAccountId);
        }
    };

    const handleToPress = async () => {
        const selectedAccountId = await openAccountSelector({
            initialAccountId: toAccountId,
            excludeAccountId: fromAccountId
        });

        if (isDefined(selectedAccountId)) {
            setValue('toAccountId', selectedAccountId);
        }
    };

    const handleSwap = () => {
        setValue('fromAccountId', toAccountId);
        setValue('toAccountId', fromAccountId);
    };

    return (
        <Animated.View entering={FadeInUp.delay(ANIMATION_DELAY).duration(200)} className="flex-row items-center gap-sm">
            <TransferAccountPicker
                label={t`From`}
                account={fromAccount}
                variant={variant}
                animatedStyle={fromAnimatedStyle}
                onPress={handleFromPress}
            />

            <HapticPressable onPress={handleSwap} accessibilityLabel={t`Swap accounts`} accessibilityRole="button">
                <CircleIcon icon={UserIconNameEnum.ArrowLeftRight} variant="ghost" size={28} iconSize={12} />
            </HapticPressable>

            <TransferAccountPicker
                label={t`To`}
                account={toAccount}
                variant={variant}
                animatedStyle={toAnimatedStyle}
                onPress={handleToPress}
            />
        </Animated.View>
    );
};
