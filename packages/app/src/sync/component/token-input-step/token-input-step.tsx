import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { Input } from '../../../@generic/component/input/input';
import { cn } from '../../../@generic/utils/cn.util';
import { isLikelyMonoToken } from '../../type-guard/is-likely-mono-token.type-guard';
import { PasteTokenButton } from '../paste-token-button/paste-token-button';
import { SyncCredentialsStepHeader } from '../sync-credentials-step-header/sync-credentials-step-header';

interface Props {
    readonly token: string;
    readonly onTokenChange: (token: string) => void;
}

export const TokenInputStep = ({ token, onTokenChange }: Props) => {
    const { t } = useLingui();

    const hasToken = isNotEmptyString(token.trim());
    const isTokenLikely = isLikelyMonoToken(token);
    const tokenCheckIcon = isTokenLikely ? UserIconNameEnum.CircleCheck : UserIconNameEnum.CircleAlert;
    const tokenCheckClassName = isTokenLikely ? 'text-positive-foreground' : 'text-warning-foreground';
    const tokenCheckLabel = isTokenLikely ? t`Looks right` : t`This doesn't look like a Monobank token yet`;

    return (
        <>
            <SyncCredentialsStepHeader provider={ExternalSourceEnum.MONOBANK} />

            <View className="gap-y-md">
                <Text className="text-secondary-foreground text-sm px-md">
                    <Trans>Paste your API token below:</Trans>
                </Text>

                <View className="flex-row items-center gap-x-sm">
                    <Input
                        className="flex-1"
                        value={token}
                        onChangeText={onTokenChange}
                        placeholder={t`Enter your Monobank API token`}
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry
                    />
                    <PasteTokenButton onPaste={onTokenChange} />
                </View>

                {hasToken ? (
                    <View className="flex-row items-center gap-x-xs px-md">
                        <Icon icon={tokenCheckIcon} size={14} className={tokenCheckClassName} />
                        <Text className={cn('text-xs', tokenCheckClassName)}>{tokenCheckLabel}</Text>
                    </View>
                ) : null}
            </View>
        </>
    );
};
