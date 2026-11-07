import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SheetHeaderAction } from '../../../@generic/component/sheet-header-action/sheet-header-action';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';

interface Props {
    readonly isLoading: boolean;
    readonly onCancel: () => void;
    readonly onConfirm: () => void;
    readonly disabled: boolean;
}

export const ConvertToTransferHeader = ({ isLoading, onCancel, onConfirm, disabled }: Props) => {
    const { t } = useLingui();

    const action = <SheetHeaderAction label={t`Done`} onPress={onConfirm} disabled={disabled} />;

    return (
        <View className="px-xl pt-[24px]">
            <LoadingContent isLoading={isLoading}>
                <SheetTitleRow title={t`Convert to Transfer`} onClose={onCancel} closeLabel={t`Cancel`} trailing={action} />
            </LoadingContent>
        </View>
    );
};
