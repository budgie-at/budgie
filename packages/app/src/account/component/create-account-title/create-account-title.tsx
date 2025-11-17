import { ACCOUNT_TITLE_MAX_LENGTH } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { FormItem } from '../../../@generic/components/form-item/form-item';
import { Input } from '../../../@generic/components/input/input';
import { Shake } from '../../../@generic/components/shake/shake';

interface Props {
    readonly fieldState: { invalid: boolean; error?: { message?: string } };
    readonly field: { onChange: (value: string) => void; value?: string };
}

export const CreateAccountTitle = ({ field: { onChange, value }, fieldState: { invalid, error } }: Props) => {
    const { t } = useLingui();

    const variant = invalid ? 'destructive' : 'default';

    return (
        <FormItem label={t`Account Name & Icon`} error={error?.message}>
            <View className="flex-row gap-x-xl">
                {/*<Controller name="icon" control={control} render={renderIconSelector} />*/}

                <Shake isEnabled={invalid}>
                    <Input
                        size="lg"
                        value={value}
                        variant={variant}
                        onChangeText={onChange}
                        className="text-ellipsis flex-1"
                        maxLength={ACCOUNT_TITLE_MAX_LENGTH}
                        placeholder={t`e.g. Savings Account`}
                    />
                </Shake>
            </View>
        </FormItem>
    );
};
