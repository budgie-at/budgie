import { ReactNode, RefObject } from 'react';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { ICONS, IconName } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetFormFooter } from '../bottom-sheet-form-footer/bottom-sheet-form-footer';
import { BottomSheetHeader } from '../bottom-sheet-header/bottom-sheet-header';
import { BottomSheetScrollView } from '../bottom-sheet-scroll-view/bottom-sheet-scroll-view';
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

    return (
        <BottomSheet enableDynamicSizing onDismiss={onDismiss} ref={ref}>
            <BottomSheetScrollView>
                <View className="px-7xl py-5xl">
                    <View className="bg-secondary-background p-xl rounded-3xl mx-auto mb-3xl border border-secondary-corner">
                        <Icon icon={ICONS[icon]} className="text-primary" size={28} />
                    </View>

                    <View className="mb-10">
                        <BottomSheetHeader size="lg" align="center" title={title} description={description} />
                    </View>

                    <View className="gap-y-3xl">{children}</View>
                </View>

                <BottomSheetFormFooter onCancel={onCancel} onSubmit={onSubmit} />
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
