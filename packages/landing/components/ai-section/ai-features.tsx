import { Shield, Sparkles, TrendingUp } from 'lucide-react';

const features = [
    {
        icon: <Sparkles className="size-5" />,
        title: 'Instant Financial Analysis',
        content:
            'Ask questions like "Why is there so little money?" and get detailed breakdowns of your spending patterns, unusual transactions, and budget insights.'
    },
    {
        icon: <Shield className="size-5" />,
        title: '100% On-Device Processing',
        content:
            'Your financial data never leaves your device. The AI runs locally, ensuring your spending habits and financial questions remain completely private.'
    },
    {
        icon: <TrendingUp className="size-5" />,
        title: 'Smart Spending Advice',
        content: `Get personalized recommendations like "Don't give a girl so much money!" and other practical insights to help you make better financial decisions.`
    }
];

export const AiFeatures = () => (
    <>
        <div className="space-y-6">
            {features.map(feature => (
                <div className="flex items-start gap-4" key={feature.title}>
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                        {feature.icon}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>

                        <p className="text-muted-foreground">{feature.content}</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="p-6 bg-muted/50 rounded-xl border border-border/40">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Example AI Conversations
            </h4>

            <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                    <div className="text-muted-foreground">You:</div>

                    <div>&quot;Why did I spend so much this month?&quot;</div>
                </div>

                <div className="flex gap-3">
                    <div className="text-primary font-medium">AI:</div>

                    <div className="text-muted-foreground">
                        &quot;You spent 40% more on dining out ($320 vs $230 average). Your largest expense was $85 at Fancy Restaurant on
                        the 15th.&quot;
                    </div>
                </div>
            </div>
        </div>
    </>
);
