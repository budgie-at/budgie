import { ReactNode, RefObject } from 'react';
import { View } from 'react-native';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetFormFooter } from '../bottom-sheet-form-footer/bottom-sheet-form-footer';
import { BottomSheetHeader } from '../bottom-sheet-header/bottom-sheet-header';
import { BottomSheetScrollView } from '../bottom-sheet-scroll-view/bottom-sheet-scroll-view';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly title?: string;
    readonly description?: string;
    readonly submitLabel?: string;
    readonly submitButtonTestID?: string;
    readonly onSubmit: EmptyFn;
    readonly onCancel: EmptyFn;
    readonly onDismiss: EmptyFn;
    readonly children: ReactNode;
}

export const FormBottomSheet = (props: Props) => {
    const { ref, title, description, submitLabel, onSubmit, onCancel, onDismiss, children, submitButtonTestID } = props;

    return (
        <BottomSheet enableDynamicSizing onDismiss={onDismiss} ref={ref}>
            <BottomSheetScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="px-7xl py-5xl">
                    {isNotEmptyString(title) ? (
                        <View className="mb-10">
                            <BottomSheetHeader size="lg" align="center" title={title} description={description} />
                        </View>
                    ) : null}

                    <View className="gap-y-3xl">{children}</View>
                </View>

                <BottomSheetFormFooter
                    submitButtonTestID={submitButtonTestID}
                    onCancel={onCancel}
                    onSubmit={onSubmit}
                    submitLabel={submitLabel}
                />
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
