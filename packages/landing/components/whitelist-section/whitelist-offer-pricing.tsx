export const WhitelistOfferPricing = () => (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-8">
        <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Regular Price</div>

            <div className="text-3xl font-bold text-muted-foreground line-through">$20/month</div>
        </div>

        <div className="hidden sm:block text-4xl text-primary">→</div>

        <div className="text-center">
            <div className="text-sm text-primary font-medium mb-2">Whitelist Price</div>

            <div className="text-4xl md:text-5xl font-bold text-primary">$15/month</div>

            <div className="text-sm text-primary font-medium">25% off for the first year</div>
        </div>
    </div>
);
