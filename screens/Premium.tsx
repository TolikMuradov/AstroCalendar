
import React from 'react';

interface PremiumProps {
  onClose: () => void;
}

const PremiumScreen: React.FC<PremiumProps> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="flex items-center justify-end p-4">
        <button 
          onClick={onClose}
          className="size-12 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="px-4">
        <div 
          className="w-full h-56 bg-cover bg-center rounded-2xl"
          style={{ backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuDhVWUl89m84hBCrLXrNk9rJJK1iCX5imObbHgffCEbPTqWA5sUtRtt4ng-PeAytr8curGxsvBxFauttpJQGg7jZIn-ESeyt6DJtO40EDkTet5oaBwyi-tY_0CaIeBwmTnCyhdZIJY8GXJnlBvKU5sILQWPTTuv18rHQ6nWcPv1jwoKuuCR5OpwGXhyIVDRAt9_ISEaWXvYuatUczqZ4PGVAHdulERBZ5_4BC2uQVaMGmH2CgjLJV4sKAi80DLdKHUUisBqgatBo53R)` }}
        />
        
        <h1 className="text-white text-[32px] font-bold text-center mt-6">Unlock Premium Profile</h1>
        <p className="text-white/70 text-center text-sm mb-8 px-4">Experience the cosmos without limits</p>

        <div className="space-y-4 mb-10">
          {[
            { icon: 'auto_awesome', label: 'Birth personalization' },
            { icon: 'insights', label: 'Detailed insights' },
            { icon: 'calendar_month', label: 'Yearly reading' },
            { icon: 'block', label: 'Ad-free experience' }
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-4 px-2">
              <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">{feat.icon}</span>
              </div>
              <p className="text-white font-medium flex-1">{feat.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="relative p-5 rounded-2xl border-2 border-primary bg-primary/10 flex justify-between items-center">
            <div className="absolute -top-3 right-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
              Best Value - Save 40%
            </div>
            <div>
              <p className="text-white font-bold text-lg">Yearly</p>
              <p className="text-white/60 text-sm">$49.99 / year</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-xl">$4.16</p>
              <p className="text-white/60 text-sm">/mo</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-white/5 flex justify-between items-center">
            <div>
              <p className="text-white font-bold text-lg">Monthly</p>
              <p className="text-white/60 text-sm">Cancel anytime</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-xl">$6.99</p>
              <p className="text-white/60 text-sm">/mo</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 pb-12">
          <button className="w-full bg-primary py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/20">
            Start Premium
          </button>
          <button className="text-white/50 text-sm font-medium hover:text-white/80 transition-colors">
            Restore purchase
          </button>
          <p className="text-[10px] text-white/30 text-center px-4 leading-relaxed">
            Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumScreen;
