import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { BottomSheetFormFooter } from '../../../@generic/component/bottom-sheet-form-footer/bottom-sheet-form-footer';
import { FormSheetHeader } from '../../../@generic/component/form-sheet-header/form-sheet-header';
import { Input } from '../../../@generic/component/input/input';

interface Props {
    readonly onClose: () => void;
}

export const TransactionCommentInput = ({ onClose }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();

    const comment = useWatch({ control, name: 'comment' });

    const handleChangeText = (text: string) => {
        setValue('comment', text);
    };

    const handleSubmit = () => {
        onClose();
    };

    return (
        <View className="flex-1">
            <FormSheetHeader>{t`Add Note`}</FormSheetHeader>

            <View className="px-xl pb-xl">
                <Input
                    value={comment}
                    onChangeText={handleChangeText}
                    placeholder={t`Enter a note...`}
                    className="h-[100px]"
                    multiline
                    autoFocus
                />
            </View>

            <BottomSheetFormFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel={t`Done`} />
        </View>
    );
};
