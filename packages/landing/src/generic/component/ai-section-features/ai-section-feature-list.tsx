import { Trans } from '@lingui/react/macro';
import { Lock, Mic, Sparkles, Zap } from 'lucide-react';

import { AiSectionFeaturesItem } from '../ai-section-features-item/ai-section-features-item';

export const AiSectionFeatureList = () => (
    <div className="space-y-6">
        <AiSectionFeaturesItem
            content={
                <Trans>
                    Ask &quot;Where did my money go?&quot; and get instant breakdowns. Qwen3 1.7B (Q4 quantized) runs entirely on your phone
                    — your questions never reach a server.
                </Trans>
            }
            icon={<Sparkles className="size-5" />}
            title={<Trans>Instant Spending Analysis</Trans>}
        />

        <AiSectionFeaturesItem
            content={
                <Trans>
                    Unlike ChatGPT or Google Assistant, Budgie&apos;s AI runs entirely on your device. The multilingual
                    nomic-embed-text-v2-moe embedding model handles all 5 supported languages natively.
                </Trans>
            }
            icon={<Lock className="size-5" />}
            title={<Trans>True Privacy, Not Just Promises</Trans>}
        />

        <AiSectionFeaturesItem
            content={
                <Trans>
                    Voice transcription via Whisper Large v3 Turbo (whisper.rn) runs on-device. Works in airplane mode — your voice never
                    streams to a server.
                </Trans>
            }
            icon={<Mic className="size-5" />}
            title={<Trans>On-Device Voice Transcription</Trans>}
        />

        <AiSectionFeaturesItem
            content={
                <Trans>
                    Works in airplane mode. No internet needed. Your financial assistant is always available—even when you&apos;re offline.
                </Trans>
            }
            icon={<Zap className="size-5" />}
            title={<Trans>Works Completely Offline</Trans>}
        />
    </div>
);
