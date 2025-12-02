import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';

interface Props {
    readonly onCancel: EmptyFn;
    readonly onApply: EmptyFn;
}

export const TransactionFilterActions = ({ onCancel, onApply }: Props) => {
    const { t } = useLingui();

    return (
        <View className="pt-3xl border-t border-t-secondary-corner px-5xl flex-row gap-x-md">
            <Button size="md" variant="ghost" content={t`Clear Filters`} onPress={onCancel} className="flex-1" />
            <Button size="md" variant="ghost" content={t`Apply Filters`} onPress={onApply} className="flex-1" />
        </View>
    );
};
