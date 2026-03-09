import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Input } from '../../../@generic/component/input/input';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { GetTokenCard } from '../get-token-card/get-token-card';

interface Props {
    readonly token: string;
    readonly onTokenChange: (token: string) => void;
}

export const TokenInputStep = ({ token, onTokenChange }: Props) => {
    const { t } = useLingui();

    return (
        <>
            <GetTokenCard />

            <SimpleHorizontalCell
                left={<CircleIcon icon={UserIconNameEnum.Info} variant="warning" size={15} iconSize={15} />}
                size="lg"
                variant="warning"
                title={t`Your token is stored securely in the database. Sync continues in the background.`}
            />

            <View className="gap-y-md">
                <Text className="text-primary text-muted-foreground text-sm px-md">
                    <Trans>Paste your API token below:</Trans>
                </Text>

                <Input
                    value={token}
                    onChangeText={onTokenChange}
                    placeholder={t`Enter your Monobank API token`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                />
            </View>
        </>
    );
};
