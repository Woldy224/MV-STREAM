import React from 'react';
import { CreditCard, Check } from 'lucide-react';

const SubscriptionPage = () => {
  const plans = [
    {
      name: 'Basic',
      price: '5',
      features: [
        'Publicités inclus',
        'Connexion a une seul appareil',
        'Accès à nos films, séries, documentaires & anime ',
        'Avec taux 132 Gourdes'
      ]
    },
    {
      name: 'Premium',
      price: '10',
      features: [
        'Pas de Pub',
        'Connexion a 4 appareil maximum',
        'Accès à tout nos contenues',
        'Les 10 premiers jours sont gratuits',
        'Avec taux 132 Gourdes'
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className="bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700 hover:border-purple-500 transition-colors"
          >
            <h2 className="text-2xl font-bold text-center mb-4">{plan.name}</h2>
            <div className="flex justify-center items-center gap-2 mb-6">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              className="w-full py-3 px-6 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              Subscribe Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPage;