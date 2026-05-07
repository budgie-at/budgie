import { Trans } from '@lingui/react/macro';
import { Camera, Cpu, Fingerprint, Key, Server } from 'lucide-react';

import { Motion } from '../motion/motion';

import { SecuritySectionCard } from './security-section-card';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const viewportOnce = { once: true };

export const SecuritySectionCards = () => (
    <Motion className="space-y-6" initial="hidden" variants={containerVariants} viewport={viewportOnce} whileInView="show">
        <SecuritySectionCard
            description={
                <Trans>
                    All your data is stored locally on your device. We have no servers storing your information—because we never see it in
                    the first place.
                </Trans>
            }
            icon={<Server className="size-6 text-green-600 dark:text-green-400" />}
            iconClassName="bg-green-100 dark:bg-green-900/30"
            title={<Trans>Zero Cloud Storage</Trans>}
        />

        <SecuritySectionCard
            description={
                <Trans>
                    Lock your app with Face ID or Touch ID. Your encrypted data is only accessible after biometric or PIN verification.
                    SQLCipher AES-256 encrypts the database file; the key lives in iOS Keychain or Android Keystore.
                </Trans>
            }
            icon={<Fingerprint className="size-6 text-blue-600 dark:text-blue-400" />}
            iconClassName="bg-blue-100 dark:bg-blue-900/30"
            title={<Trans>Biometric Lock</Trans>}
        />

        <SecuritySectionCard
            description={
                <Trans>
                    Your encryption key lives in iOS Keychain or Android Keystore — both hardware-backed where available. SQLCipher
                    AES-256 encrypts the database file so raw storage access reveals nothing.
                </Trans>
            }
            icon={<Cpu className="size-6 text-indigo-600 dark:text-indigo-400" />}
            iconClassName="bg-indigo-100 dark:bg-indigo-900/30"
            title={<Trans>Hardware-Backed Encryption Key</Trans>}
        />

        <SecuritySectionCard
            description={
                <Trans>Set a custom PIN code with configurable length for an extra layer of security. Perfect for shared devices.</Trans>
            }
            icon={<Key className="size-6 text-purple-600 dark:text-purple-400" />}
            iconClassName="bg-purple-100 dark:bg-purple-900/30"
            title={<Trans>PIN Protection</Trans>}
        />

        <SecuritySectionCard
            description={
                <Trans>
                    Automatically hide sensitive balances when taking screenshots. Share your app safely without exposing your finances.
                </Trans>
            }
            icon={<Camera className="size-6 text-orange-600 dark:text-orange-400" />}
            iconClassName="bg-orange-100 dark:bg-orange-900/30"
            title={<Trans>Screenshot Protection</Trans>}
        />
    </Motion>
);
