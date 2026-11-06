import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TransactionPickerAction } from '../transaction-picker-action/transaction-picker-action';

interface Props {
    readonly onRetry: () => void;
}

export const TransactionPickerFailure = ({ onRetry }: Props) => {
    const { t } = useLingui();

    return (
        <View className="gap-y-xl py-3xl">
            <CircleIcon icon={UserIconNameEnum.TriangleAlert} variant="secondary" border={false} />
            <Text dynamicTypeRamp="headline" className="text-[17px] font-semibold text-primary">
                <Trans>Couldn’t load this list</Trans>
            </Text>
            <Text dynamicTypeRamp="footnote" className="text-[13px] text-secondary-foreground">
                <Trans>Your data is safe. Reading it failed this time.</Trans>
            </Text>
            <TransactionPickerAction label={t`Try again`} onPress={onRetry} />
        </View>
    );
};
