import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.STRIPE_PUBLIC_KEY!);

interface PricingFeature {
  name: string;
  free: boolean;
  pro: boolean;
}

const features: PricingFeature[] = [
  { name: '10 Daily Credits', free: true, pro: true },
  { name: 'Script Generation', free: true, pro: true },
  { name: 'TTS Generation', free: true, pro: true },
  { name: 'Unlimited Daily Credits', free: false, pro: true },
  { name: 'Priority Support', free: false, pro: true },
  { name: 'Advanced Analytics', free: false, pro: true },
];

export function PricingPage() {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
      });
      const { sessionId } = await response.json();

      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscribed = user?.publicMetadata?.subscriptionStatus === 'active';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Select the perfect plan for your content creation needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">$0/month</div>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  {feature.free ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="h-4 w-4 text-gray-300">×</span>
                  )}
                  <span className={!feature.free ? 'text-muted-foreground' : ''}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              disabled={true}
            >
              Current Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-2 border-orange-500">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              RECOMMENDED
            </span>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pro
              <Zap className="h-5 w-5 text-yellow-500" />
            </CardTitle>
            <CardDescription>For serious content creators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">$19/month</div>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  {feature.pro && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  <span>{feature.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleSubscribe}
              disabled={isLoading || !isLoaded || isSubscribed}
            >
              {isLoading ? (
                'Processing...'
              ) : isSubscribed ? (
                'Current Plan'
              ) : (
                'Upgrade to Pro'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 