import { AiDetailsHeader } from './ai-details-header';

export const AiDetails = () => (
    <div className="relative mx-auto max-w-sm">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/40 bg-gradient-to-b from-background to-muted/20">
            <AiDetailsHeader />

            <div className="p-4 space-y-4 bg-background">
                <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm max-w-[80%]">
                        Why is there so little money left?
                    </div>
                </div>

                <div className="flex justify-start">
                    <div className="bg-muted px-3 py-2 rounded-lg text-sm max-w-[80%]">
                        I analyzed your spending and found you spent $450 more than usual this month. The main culprits: $280 on
                        entertainment and $170 on impulse purchases. Want me to show you the breakdown?
                    </div>
                </div>

                <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm max-w-[80%]">
                        Yes, show me the details
                    </div>
                </div>

                <div className="flex justify-start">
                    <div className="bg-muted px-3 py-2 rounded-lg text-sm max-w-[80%]">
                        Here&apos;s your spending spike: 🎬 Movies & concerts: $180 🛍️ Online shopping: $120 🍕 Food delivery: $100.
                        Consider setting a $200 entertainment budget next month?
                    </div>
                </div>
            </div>
        </div>

        <div className="absolute -bottom-6 -right-6 -z-10 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl opacity-70" />

        <div className="absolute -top-6 -left-6 -z-10 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 blur-3xl opacity-70" />
    </div>
);
