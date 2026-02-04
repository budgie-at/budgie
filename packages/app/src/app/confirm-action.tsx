import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '../@generic/component/button/button';
import { CircleIcon } from '../@generic/component/circle-icon/circle-icon';
import { useConfirmActionModal } from '../@generic/context/confirm-action-modal.context';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

export default function ConfirmActionModal() {
    const { t } = useLingui();
    const { currentParams, resolveConfirmAction } = useConfirmActionModal();
    const { backgroundColor } = useFormsheetListStyles();
    const containerStyle = { flex: 1, backgroundColor };

    const handleConfirm = () => void resolveConfirmAction(true);
    const handleCancel = () => void resolveConfirmAction(false);

    if (!currentParams) {
        return null;
    }

    const { variant, icon, title, description, buttonText, buttonIcon, cancelText, isLoading, isDisabled, children } = currentParams;

    const isButtonDisabled = isDisabled || isLoading;
    const submitButtonContent = isLoading ? <ActivityIndicator size="small" /> : buttonText;

    return (
        <View style={containerStyle}>
            <View className="px-5 pt-7xl pb-5xl">
                <CircleIcon icon={icon} variant={variant} size={50} iconSize={24} className="mb-4xl self-center rounded-3xl" />
                <Text className="text-primary text-xl font-semibold text-center mb-sm">{title}</Text>
                {description ? <Text className="text-secondary-foreground text-center text-sm mb-3xl">{description}</Text> : null}
                {children ? <View className="mb-3xl">{children}</View> : null}
                <View className="gap-y-md">
                    <Button
                        leftIcon={buttonIcon}
                        content={submitButtonContent}
                        disabled={isButtonDisabled}
                        onPress={handleConfirm}
                        variant={variant}
                    />
                    <Button onPress={handleCancel} content={cancelText ?? t`Cancel`} variant="ghost" disabled={isLoading} />
                </View>
            </View>
        </View>
    );
}
