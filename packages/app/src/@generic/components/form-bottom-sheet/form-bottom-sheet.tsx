import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ReactNode, RefObject } from 'react';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { IconName, ICONS } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { FormBottomSheetFooter } from '../form-bottom-sheet-footer/form-bottom-sheet-footer';
import { BottomSheetHeader } from '../bottom-sheet-header/bottom-sheet-header';
import { Icon } from '../icon/icon';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly icon: IconName;
    readonly title: string;
    readonly description: string;
    readonly onSubmit: EmptyFn;
    readonly onCancel: EmptyFn;
    readonly onDismiss: EmptyFn;
    readonly children: ReactNode;
}

export const FormBottomSheet = (props: Props) => {
    const { ref, icon, title, description, onSubmit, onCancel, onDismiss, children } = props;

    return (
        <BottomSheet onDismiss={onDismiss} ref={ref}>
            <BottomSheetScrollView enableFooterMarginAdjustment showsVerticalScrollIndicator={false}>
                <View className="px-5xl pt-5xl mb-3xl">
                    <View className="bg-secondary-background p-xl rounded-3xl mx-auto mb-3xl border border-secondary-corner">
                        <Icon icon={ICONS[icon]} className="text-primary" size={28} />
                    </View>

                    <View className="mb-10">
                        <BottomSheetHeader size="lg" align="center" title={title} description={description} />
                    </View>

                    <View className="gap-y-3xl">{children}</View>
                </View>

                <SafeAreaView edges={['bottom']}>
                    <FormBottomSheetFooter onCancel={onCancel} onSubmit={onSubmit} />
                </SafeAreaView>
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
