import { AccountEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../../../@generic/components/bottom-sheet-view/bottom-sheet-view';
import { Button } from '../../../@generic/components/button/button';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';

interface Props extends Pick<AccountEntityInterface, 'title'> {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly onRestore: EmptyFn;
}

export const RestoreAccountBottomSheet = ({ title, ref, onRestore }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const { t } = useLingui();

    const handleCancel = () => void ref.current?.close();

    return (
        <BottomSheet
            className="mx-5xl rounded-5xl overflow-hidden shadow-[0px_0px_15px_-8px_rgba(0,_0,_0,_0.75)] border-2 border-positive-corner"
            ref={ref}
            bottomInset={bottom}
            enablePanDownToClose={true}
            detached={true}
        >
            <BottomSheetView enableFooterMarginAdjustment={true} className="mx-5 bg-transparent pt-xl pb-5xl">
                <CircleIcon icon={ICONS.RotateCcw} variant="positive" size="2xl" className="mb-8xl self-center rounded-3xl" />

                <Text className="text-primary text-xl font-semibold text-center mb-sm">
                    <Trans>Restore Account?</Trans>
                </Text>

                <Text className="text-secondary-foreground text-center text-sm mb-3xl">
                    <Text className="text-primary font-semibold">{title}&nbsp;</Text>
                    <Trans>will be restored to your main view and included in totals.</Trans>
                </Text>

                <View className="gap-y-md">
                    <Button
                        className="bg-positive-foreground border-2 border-positive-foreground"
                        textClassName="text-white font-semibold"
                        content={t`Restore`}
                        onPress={onRestore}
                    />
                    <Button
                        onPress={handleCancel}
                        className="text-primary font-semibold bg-transparent border-2 border-secondary-corner"
                        content={t`Cancel`}
                    />
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
