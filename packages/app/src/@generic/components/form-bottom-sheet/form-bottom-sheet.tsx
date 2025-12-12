import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ComponentProps, ReactNode, RefObject } from 'react';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { ICONS, IconName } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetFooter } from '../bottom-sheet-footer/bottom-sheet-footer';
import { BottomSheetFormFooter } from '../bottom-sheet-form-footer/bottom-sheet-form-footer';
import { BottomSheetHeader } from '../bottom-sheet-header/bottom-sheet-header';
import { Icon } from '../icon/icon';

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

    const renderFooter = (props: ComponentProps<typeof BottomSheetFooter>) => (
        <BottomSheetFooter {...props}>
            <BottomSheetFormFooter onCancel={onCancel} onSubmit={onSubmit} />
        </BottomSheetFooter>
    );

    return (
        <BottomSheet enableDynamicSizing footerComponent={renderFooter} onDismiss={onDismiss} ref={ref}>
            <BottomSheetScrollView showsVerticalScrollIndicator={false}>
                <View className="px-5xl pt-5xl pb-[100px]">
                    <View className="bg-secondary-background p-xl rounded-3xl mx-auto mb-3xl border border-secondary-corner">
                        <Icon icon={ICONS[icon]} className="text-primary" size={28} />
                    </View>

                    <View className="mb-10">
                        <BottomSheetHeader size="lg" align="center" title={title} description={description} />
                    </View>

                    <View className="gap-y-3xl">{children}</View>
                </View>
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
