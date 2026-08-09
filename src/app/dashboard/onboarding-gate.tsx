'use client';

import { useState, useEffect } from 'react';
import OnboardingWizard from './onboarding';

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('/api/settings/company')
      .then(r => r.json())
      .then(data => {
        if (data.user && !data.user.onboarding_completed) {
          setShowOnboarding(true);
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  if (!checked) return null;

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
    </>
  );
}
