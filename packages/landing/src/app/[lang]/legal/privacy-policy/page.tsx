/* eslint-disable max-lines, max-lines-per-function -- legal page keeps binding copy inline instead of MDX or registries */
import { Trans } from '@lingui/react/macro';

import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { PRIVACY_POLICY_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return {
        title: i18n._(PRIVACY_POLICY_METADATA.title),
        description: i18n._(PRIVACY_POLICY_METADATA.description)
    };
}

export default async function PrivacyPolicyPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);
    const updatedAtText = i18n._(PRIVACY_POLICY_METADATA.updatedAt);

    return (
        <>
            <h1>
                <Trans>Privacy Policy</Trans>
            </h1>
            <p>
                <strong>
                    <Trans>Last Updated: {updatedAtText}</Trans>
                </strong>
            </p>
            <h2>
                <Trans>1. Introduction</Trans>
            </h2>
            <p>
                <Trans>
                    Budgie (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
                    explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website
                    (collectively, the &quot;Service&quot;). We are a privacy-first financial tracking application that operates on an
                    offline-first basis, meaning your financial data stays on your device.
                </Trans>
            </p>
            <h2>
                <Trans>2. Data We Collect</Trans>
            </h2>
            <h3>
                <Trans>2.1 Information Stored Locally on Your Device</Trans>
            </h3>
            <p>
                <Trans>
                    The following data is stored exclusively on your device and is never transmitted to our servers unless you explicitly
                    enable optional cloud features:
                </Trans>
            </p>
            <ul>
                <li>
                    <Trans>Financial transactions and expense records</Trans>
                </li>
                <li>
                    <Trans>Account balances and banking information (if bank sync is enabled)</Trans>
                </li>
                <li>
                    <Trans>Budget settings and categories</Trans>
                </li>
                <li>
                    <Trans>Investment portfolio data (stocks and cryptocurrency holdings)</Trans>
                </li>
                <li>
                    <Trans>Debt and loan information</Trans>
                </li>
                <li>
                    <Trans>Financial goals and targets</Trans>
                </li>
                <li>
                    <Trans>AI chat conversations and financial insights</Trans>
                </li>
            </ul>
            <h3>
                <Trans>2.2 Information We May Collect</Trans>
            </h3>
            <p>
                <Trans>With your explicit consent, we may collect the following minimal information:</Trans>
            </p>
            <ul>
                <li>
                    <Trans>Anonymous usage analytics (e.g., feature usage patterns, crash reports) - opt-in only</Trans>
                </li>
                <li>
                    <Trans>Device information (type, operating system version) for debugging purposes</Trans>
                </li>
                <li>
                    <Trans>Authentication tokens for optional bank sync services (stored securely in device keychain)</Trans>
                </li>
            </ul>
            <h2>
                <Trans>3. How We Use Your Information</Trans>
            </h2>
            <p>
                <Trans>We use the limited information we collect to:</Trans>
            </p>
            <ul>
                <li>
                    <Trans>Provide and maintain the Service</Trans>
                </li>
                <li>
                    <Trans>Improve and optimize app performance</Trans>
                </li>
                <li>
                    <Trans>Identify and fix bugs and technical issues</Trans>
                </li>
                <li>
                    <Trans>Facilitate optional bank synchronization (with your explicit consent)</Trans>
                </li>
                <li>
                    <Trans>Provide customer support</Trans>
                </li>
                <li>
                    <Trans>Send important updates about the Service (security notices, policy changes)</Trans>
                </li>
            </ul>
            <p>
                <Trans>
                    We do NOT use your financial data for advertising, profiling, or any commercial purposes beyond providing the Service to
                    you.
                </Trans>
            </p>
            <h2>
                <Trans>4. Data Storage and Security</Trans>
            </h2>
            <h3>
                <Trans>4.1 Local Storage</Trans>
            </h3>
            <p>
                <Trans>
                    All your financial data is stored locally on your device using industry-standard encryption. We utilize device-level
                    security features including:
                </Trans>
            </p>
            <ul>
                <li>
                    <Trans>Encrypted local database storage</Trans>
                </li>
                <li>
                    <Trans>Secure keychain/keystore for sensitive credentials</Trans>
                </li>
                <li>
                    <Trans>Device biometric authentication support</Trans>
                </li>
            </ul>
            <h3>
                <Trans>4.2 Third-Party Services</Trans>
            </h3>
            <p>
                <Trans>When you opt into optional features, we may use the following trusted third-party services:</Trans>
            </p>
            <ul>
                <li>
                    <Trans>Bank sync providers (only with your explicit authorization)</Trans>
                </li>
                <li>
                    <Trans>Market data providers for investment pricing</Trans>
                </li>
                <li>
                    <Trans>Cloud AI services (only when you enable cloud-assisted AI features)</Trans>
                </li>
                <li>
                    <Trans>Analytics services (anonymous, opt-in only)</Trans>
                </li>
            </ul>
            <p>
                <Trans>
                    These services have their own privacy policies, and we carefully select partners who meet our high privacy standards.
                </Trans>
            </p>
            <h2>
                <Trans>5. Data Sharing and Disclosure</Trans>
            </h2>
            <p>
                <Trans>
                    We do not sell, trade, or rent your personal information to third parties. We may share limited information only in the
                    following circumstances:
                </Trans>
            </p>
            <ul>
                <li>
                    <Trans>With your explicit consent</Trans>
                </li>
                <li>
                    <Trans>To comply with legal obligations (e.g., court orders, regulatory requirements)</Trans>
                </li>
                <li>
                    <Trans>To protect our rights, property, or safety, or that of our users or the public</Trans>
                </li>
                <li>
                    <Trans>With service providers who assist in operating the Service (bound by strict confidentiality agreements)</Trans>
                </li>
                <li>
                    <Trans>In connection with a merger, acquisition, or sale of assets (users will be notified)</Trans>
                </li>
            </ul>
            <h2>
                <Trans>6. Your Rights and Choices</Trans>
            </h2>
            <p>
                <Trans>You have the following rights regarding your data:</Trans>
            </p>
            <ul>
                <li>
                    <Trans>
                        <strong>Access</strong>: Your data is always accessible within the app
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Correction</strong>: You can edit or correct your data at any time
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Deletion</strong>: You can delete your data by uninstalling the app or using the in-app data deletion
                        feature
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Portability</strong>: Export your data in CSV format at any time
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Opt-out</strong>: Disable analytics and optional cloud features in app settings
                    </Trans>
                </li>
                <li>
                    <Trans>
                        <strong>Revoke consent</strong>: Disconnect bank sync or disable cloud AI at any time
                    </Trans>
                </li>
            </ul>
            <h2>
                <Trans>7. Children&apos;s Privacy</Trans>
            </h2>
            <p>
                <Trans>
                    Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from
                    children. If you are a parent or guardian and believe your child has provided us with personal information, please
                    contact us immediately.
                </Trans>
            </p>
            <h2>
                <Trans>8. International Data Transfers</Trans>
            </h2>
            <p>
                <Trans>
                    Since your financial data is stored locally on your device, international data transfers are minimal. However, if you
                    use optional cloud features, your data may be processed in countries where our service providers operate. We ensure
                    appropriate safeguards are in place to protect your data in compliance with applicable data protection laws including
                    GDPR and CCPA.
                </Trans>
            </p>
            <h2>
                <Trans>9. Data Retention</Trans>
            </h2>
            <p>
                <Trans>
                    Your financial data remains on your device until you choose to delete it. If you use optional cloud features, we retain
                    your data only as long as necessary to provide the Service or as required by law. Anonymous analytics data may be
                    retained indefinitely in aggregated form.
                </Trans>
            </p>
            <h2>
                <Trans>10. Changes to This Privacy Policy</Trans>
            </h2>
            <p>
                <Trans>
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new
                    Privacy Policy on this page and updating the &quot;Last Updated&quot; date. For significant changes, we will provide
                    prominent notice within the app. Your continued use of the Service after changes become effective constitutes acceptance
                    of the revised policy.
                </Trans>
            </p>
            <h2>
                <Trans>11. Contact Us</Trans>
            </h2>
            <p>
                <Trans>
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us
                    at:
                </Trans>
            </p>
            <p>
                <Trans>
                    <strong>Budgie</strong> Email: privacy@budgie.at Website: https://budgie.at
                </Trans>
            </p>
            <h2>
                <Trans>12. Legal Framework Compliance</Trans>
            </h2>
            <p>
                <Trans>This Privacy Policy is designed to comply with:</Trans>
            </p>
            <ul>
                <li>
                    <Trans>General Data Protection Regulation (GDPR) - European Union</Trans>
                </li>
                <li>
                    <Trans>California Consumer Privacy Act (CCPA) - United States</Trans>
                </li>
                <li>
                    <Trans>Personal Information Protection and Electronic Documents Act (PIPEDA) - Canada</Trans>
                </li>
                <li>
                    <Trans>Other applicable data protection and privacy laws</Trans>
                </li>
            </ul>
        </>
    );
}
