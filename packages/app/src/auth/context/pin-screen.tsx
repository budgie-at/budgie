import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthService } from './auth.service';

interface PinScreenProps {
    mode: 'setup' | 'verify';
    onSuccess: () => void;
    onCancel?: () => void;
}

export function PinScreen({ mode, onSuccess, onCancel }: PinScreenProps) {
    const { t } = useLingui();
    const colorScheme = useColorScheme();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [error, setError] = useState('');

    const PIN_LENGTH = 4;

    const iconColor = colorScheme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)';
    const biometricColor = 'rgb(43, 127, 255)';

    useEffect(() => {
        checkBiometric();
    }, []);

    const checkBiometric = async () => {
        const available = await AuthService.isBiometricAvailable();
        console.log('Biometric available:', available);
        setBiometricAvailable(available);

        if (available && mode === 'verify') {
            const enabled = await AuthService.isBiometricEnabled();
            console.log('Biometric enabled:', enabled);
            if (enabled) {
                handleBiometricAuth();
            }
        }
    };

    const handleBiometricAuth = async () => {
        try {
            const success = await AuthService.authenticateWithBiometrics();
            if (success) {
                onSuccess();
            }
        } catch (error) {
            console.error('Biometric auth error:', error);
            Alert.alert(t`Authentication Failed`, t`Please try again or use your PIN`);
        }
    };

    const handleNumberPress = (num: string) => {
        setError('');

        if (step === 'enter') {
            if (pin.length < PIN_LENGTH) {
                const newPin = pin + num;
                setPin(newPin);

                if (newPin.length === PIN_LENGTH) {
                    if (mode === 'setup') {
                        setStep('confirm');
                    } else {
                        verifyPin(newPin);
                    }
                }
            }
        } else {
            if (confirmPin.length < PIN_LENGTH) {
                const newConfirmPin = confirmPin + num;
                setConfirmPin(newConfirmPin);

                if (newConfirmPin.length === PIN_LENGTH) {
                    if (pin === newConfirmPin) {
                        savePin(pin);
                    } else {
                        setError(t`PINs do not match`);
                        setTimeout(() => {
                            setPin('');
                            setConfirmPin('');
                            setStep('enter');
                            setError('');
                        }, 1500);
                    }
                }
            }
        }
    };

    const savePin = async (pinToSave: string) => {
        await AuthService.savePin(pinToSave);

        if (biometricAvailable) {
            const types = await AuthService.getBiometricTypes();
            Alert.alert(t`Enable Biometric Authentication`, t`Would you like to enable ${types.join(' or ')} for faster login?`, [
                {
                    text: t`No Thanks`,
                    onPress: () => onSuccess(),
                    style: 'cancel'
                },
                {
                    text: t`Enable`,
                    onPress: async () => {
                        await AuthService.setBiometricEnabled(true);
                        onSuccess();
                    }
                }
            ]);
        } else {
            onSuccess();
        }
    };

    const verifyPin = async (enteredPin: string) => {
        const isValid = await AuthService.verifyPin(enteredPin);
        if (isValid) {
            onSuccess();
        } else {
            setError(t`Incorrect PIN`);
            setTimeout(() => {
                setPin('');
                setError('');
            }, 1500);
        }
    };

    const handleDelete = () => {
        setError('');
        if (step === 'enter') {
            setPin(pin.slice(0, -1));
        } else {
            setConfirmPin(confirmPin.slice(0, -1));
        }
    };

    const renderPinDots = () => {
        const currentPin = step === 'enter' ? pin : confirmPin;
        return (
            <View className="flex-row justify-center mb-16">
                {[...Array(PIN_LENGTH)].map((_, index) => (
                    <View
                        key={index}
                        className={`w-4 h-4 rounded-full border-2 border-primary mx-3xl ${
                            index < currentPin.length ? 'bg-primary' : 'bg-transparent'
                        }`}
                    />
                ))}
            </View>
        );
    };

    const renderKeypad = () => {
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'empty', '0', 'delete'];

        return (
            <View className="flex-row flex-wrap justify-center max-w-[300px] self-center">
                {keys.map((key, index) => {
                    if (key === 'empty') {
                        return <View key={`empty-${index}`} className="w-20 h-20 m-2xl" />;
                    }
                    if (key === 'delete') {
                        return (
                            <TouchableOpacity
                                key={key}
                                className="w-20 h-20 justify-center items-center m-2xl active:opacity-50"
                                onPress={handleDelete}
                            >
                                <MaterialIcons name="backspace" size={28} color={iconColor} />
                            </TouchableOpacity>
                        );
                    }
                    return (
                        <TouchableOpacity
                            key={key}
                            className="w-20 h-20 justify-center items-center m-2xl active:opacity-50"
                            onPress={() => handleNumberPress(key)}
                        >
                            <Text className="text-4xl font-light text-primary">{key}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const getTitle = () => {
        if (mode === 'setup') {
            return step === 'enter' ? t`Create Your PIN` : t`Confirm Your PIN`;
        }
        return t`Enter Your PIN`;
    };

    return (
        <View className="flex-1 bg-secondary-reverse pt-16 px-5xl">
            <View className="items-center mb-10">
                <Text className="text-3xl font-semibold text-primary mb-2xl">{getTitle()}</Text>
                {error ? <Text className="text-sm text-destructive-foreground mt-2xl">{error}</Text> : null}
            </View>

            {renderPinDots()}
            {renderKeypad()}

            {biometricAvailable && mode === 'verify' && (
                <TouchableOpacity className="flex-row items-center justify-center mt-8 active:opacity-50" onPress={handleBiometricAuth}>
                    <MaterialIcons name="fingerprint" size={32} color={biometricColor} />
                    <Text className="text-md text-default-foreground ml-2xl">{t`Use Biometric`}</Text>
                </TouchableOpacity>
            )}

            {onCancel && (
                <TouchableOpacity className="self-center mt-5xl p-2xl active:opacity-50" onPress={onCancel}>
                    <Text className="text-md text-default-foreground">{t`Cancel`}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
