import { Clock, Shield, Sparkles } from 'lucide-react';

const benefits = [
    {
        icon: <Clock className="size-6" />,
        title: 'Early Access',
        description: 'Get Budgie Pro before the public launch'
    },
    {
        icon: <Sparkles className="size-6" />,
        title: 'First Year Discount',
        description: '25% off your first year of Budgie Pro'
    },
    {
        icon: <Shield className="size-6" />,
        title: 'Priority Support',
        description: 'Direct line to our development team'
    }
];

export const WhitelistOfferBenefits = () => (
    <div className="grid md:grid-cols-3 gap-6 py-6">
        {benefits.map(benefit => (
            <div className="text-center space-y-3" key={benefit.title}>
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    {benefit.icon}
                </div>

                <h3 className="font-semibold">{benefit.title}</h3>

                <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
        ))}
    </div>
);
