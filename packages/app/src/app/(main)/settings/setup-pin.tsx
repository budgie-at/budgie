import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../auth/context/auth.context';
import { AuthService } from '../../../auth/context/auth.service';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { Page } from '../../../@generic/components/page/page';

type Step = 'create' | 'confirm' | 'biometric';

export default function SetupPinScreen() {
    const { t } = useLingui();
    const router = useRouter();
    const { enablePin } = useAuth();

    const [step, setStep] = useState<Step>('create');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [biometricTypes, setBiometricTypes] = useState<string[]>([]);

    const PIN_LENGTH = 4;
    const iconColor = 'rgb(255, 255, 255)';

    useEffect(() => {
        loadBiometricTypes();
    }, []);

    const loadBiometricTypes = async () => {
        const types = await AuthService.getBiometricTypes();
        setBiometricTypes(types);
    };

    const handleNumberPress = (num: string) => {
        setError('');

        if (step === 'create') {
            if (pin.length < PIN_LENGTH) {
                const newPin = pin + num;
                setPin(newPin);

                if (newPin.length === PIN_LENGTH) {
                    setStep('confirm');
                }
            }
        } else if (step === 'confirm') {
            if (confirmPin.length < PIN_LENGTH) {
                const newConfirmPin = confirmPin + num;
                setConfirmPin(newConfirmPin);

                if (newConfirmPin.length === PIN_LENGTH) {
                    if (pin === newConfirmPin) {
                        handlePinConfirmed();
                    } else {
                        setError(t`PINs do not match`);
                        setTimeout(() => {
                            setPin('');
                            setConfirmPin('');
                            setStep('create');
                            setError('');
                        }, 1500);
                    }
                }
            }
        }
    };

    const handlePinConfirmed = async () => {
        const biometricAvailable = await AuthService.isBiometricAvailable();

        if (biometricAvailable) {
            setStep('biometric');
        } else {
            await finishSetup(false);
        }
    };

    const finishSetup = async (enableBiometric: boolean) => {
        await enablePin(pin);

        if (enableBiometric) {
            const success = await AuthService.authenticateWithBiometrics();
            if (success) {
                await AuthService.setBiometricEnabled(true);
            }
        }

        router.back();
    };

    const handleDelete = () => {
        setError('');
        if (step === 'create') {
            setPin(pin.slice(0, -1));
        } else if (step === 'confirm') {
            setConfirmPin(confirmPin.slice(0, -1));
        }
    };

    const handleGoBack = () => {
        if (step === 'confirm') {
            setConfirmPin('');
            setStep('create');
        } else {
            router.back();
        }
    };

    const renderPinDots = () => {
        const currentPin = step === 'create' ? pin : confirmPin;
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

    const renderBiometricStep = () => {
        return (
            <View className="flex-1 items-center justify-center px-5xl">
                <MaterialIcons name="fingerprint" size={80} color="rgb(43, 127, 255)" />

                <Text className="text-3xl font-semibold text-primary mt-7xl mb-2xl text-center">{t`Enable Biometric?`}</Text>

                <Text className="text-md text-secondary-foreground text-center mb-8xl">
                    {t`Use ${biometricTypes.join(' or ')} for faster and more secure access`}
                </Text>

                <TouchableOpacity
                    className="bg-default-background border-2 border-default-corner rounded-2xl px-7xl py-4xl mb-3xl w-full active:opacity-70"
                    onPress={() => finishSetup(true)}
                >
                    <Text className="text-md font-semibold text-default-foreground text-center">{t`Enable Biometric`}</Text>
                </TouchableOpacity>

                <TouchableOpacity className="py-3xl active:opacity-70" onPress={() => finishSetup(false)}>
                    <Text className="text-md text-secondary-foreground">{t`Skip`}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const getTitle = () => {
        if (step === 'create') return t`Create Your PIN`;
        if (step === 'confirm') return t`Confirm Your PIN`;
        return '';
    };

    if (step === 'biometric') {
        return <Page header={<PageHeader onGoBack={() => finishSetup(false)} size="md" title="" />}>{renderBiometricStep()}</Page>;
    }

    return (
        <Page header={<PageHeader onGoBack={handleGoBack} size="md" title="" />}>
            <View className="flex-1 pt-16 px-5xl">
                <View className="items-center mb-10">
                    <Text className="text-3xl font-semibold text-primary mb-2xl">{getTitle()}</Text>
                    {error ? <Text className="text-sm text-destructive-foreground mt-2xl">{error}</Text> : null}
                </View>

                {renderPinDots()}
                {renderKeypad()}
            </View>
        </Page>
    );
}
