/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppProvider } from './store';
import Layout from './components/Layout';
import TodayView from './views/TodayView';
import PlanningView from './views/PlanningView';
import ProgressionView from './views/ProgressionView';
import GoalView from './views/GoalView';
import ProfileView from './views/ProfileView';
import OnboardingView from './views/OnboardingView';
import { TabID } from './types';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabID>('today');
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  return (
    <AppProvider>
      {!onboardingCompleted ? (
        <OnboardingView onComplete={() => setOnboardingCompleted(true)} />
      ) : (
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <AnimatePresence mode="wait">
          {activeTab === 'today' && <TodayView key="today" />}
          {activeTab === 'plan' && <PlanningView key="plan" />}
          {activeTab === 'progression' && <ProgressionView key="progression" />}
          {activeTab === 'goal' && <GoalView key="goal" />}
          {activeTab === 'profile' && <ProfileView key="profile" />}
        </AnimatePresence>
      </Layout>
      )}
    </AppProvider>
  );
}
