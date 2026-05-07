import { Trans } from '@lingui/react/macro';
import { Code2, Fingerprint, WifiOff, Zap } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '../../../ui/badge';
import { Motion } from '../motion/motion';

import { UspPillar } from './usp-pillar';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

interface Props {
    readonly locale: string;
}

export const UspPillarsSection = ({ locale }: Props) => (
    <section className="w-full py-20 md:py-28 bg-muted/30">
        <div className="container px-4 md:px-6">
            <Motion
                className="text-center mb-16"
                initial={initialMotion}
                transition={transitionMotion}
                viewport={viewportOnce}
                whileInView={animatedMotion}
            >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium mb-6" variant="secondary">
                    <Trans>What Makes Us Different</Trans>
                </Badge>

                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                    <Trans>Built Different. Built Better.</Trans>
                </h2>

                <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
                    <Trans>We took the opposite approach to every other budgeting app. Here&apos;s why that matters for you.</Trans>
                </p>
            </Motion>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                <Link
                    className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    href={`/${locale}/offline-first`}
                >
                    <UspPillar
                        delay={0}
                        description={
                            <Trans>Your financial data never leaves your phone. No servers, no cloud, no risk of data breaches.</Trans>
                        }
                        icon={<WifiOff className="size-8 text-white" />}
                        title={<Trans>100% Offline</Trans>}
                        variant="blue"
                    />
                </Link>

                <UspPillar
                    delay={0.1}
                    description={<Trans>No server round-trips. Every action is instant. The app works even in airplane mode.</Trans>}
                    icon={<Zap className="size-8 text-white" />}
                    title={<Trans>Blazing Fast</Trans>}
                    variant="orange"
                />

                <Link
                    className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    href={`/${locale}/security`}
                >
                    <UspPillar
                        delay={0.2}
                        description={
                            <Trans>
                                Face ID, Touch ID, or PIN unlock your encrypted vault. Hardware-backed in iOS Keychain and Android Keystore.
                            </Trans>
                        }
                        icon={<Fingerprint className="size-8 text-white" />}
                        title={<Trans>Biometric Locked</Trans>}
                        variant="green"
                    />
                </Link>

                <Link
                    className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    href={`/${locale}/open-source`}
                >
                    <UspPillar
                        delay={0.3}
                        description={<Trans>The source code is public on GitHub. Security researchers and anyone can audit it.</Trans>}
                        icon={<Code2 className="size-8 text-white" />}
                        title={<Trans>Public Source</Trans>}
                        variant="purple"
                    />
                </Link>
            </div>
        </div>
    </section>
);
