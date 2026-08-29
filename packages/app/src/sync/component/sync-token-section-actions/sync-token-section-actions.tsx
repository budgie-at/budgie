import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';

interface Props {
    readonly onCancel: EmptyFn;
    readonly onSave: EmptyFn;
    readonly isSaving: boolean;
}

export const SyncTokenSectionActions = ({ onCancel, onSave, isSaving }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-row gap-x-sm">
            <Button variant="secondary" size="sm" onPress={onCancel} className="flex-1" content={t`Cancel`} />
            <Button variant="default" size="sm" onPress={onSave} disabled={isSaving} className="flex-1" content={t`Save`} />
        </View>
    );
};
