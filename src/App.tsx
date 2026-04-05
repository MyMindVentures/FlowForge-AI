import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MobileShell } from './ai-interviewer/components/ui';
import {
  ActivityScreen,
  CreateProjectScreen,
  DashboardScreen,
  DecisionLogScreen,
  DependenciesScreen,
  FeatureDetailScreen,
  FeatureListScreen,
  HandoffScreen,
  InterviewScreen,
  OnboardingScreen,
  ProjectOverviewScreen,
  RoadmapScreen,
  SettingsScreen,
  StructuredMemoryScreen,
  VersionHistoryScreen,
} from './ai-interviewer/screens';
import { InterviewStoreProvider } from './ai-interviewer/store';

/**
 * Main application router for the AI Product Interviewer MVP.
 */
function App() {
  return (
    <InterviewStoreProvider>
      <BrowserRouter>
        <MobileShell>
          <Routes>
            <Route path="/" element={<OnboardingScreen />} />
            <Route path="/projects" element={<DashboardScreen />} />
            <Route path="/projects/new" element={<CreateProjectScreen />} />
            <Route path="/projects/:projectId/overview" element={<ProjectOverviewScreen />} />
            <Route path="/projects/:projectId/interview" element={<InterviewScreen />} />
            <Route path="/projects/:projectId/memory" element={<StructuredMemoryScreen />} />
            <Route path="/projects/:projectId/features" element={<FeatureListScreen />} />
            <Route path="/projects/:projectId/features/:featureId" element={<FeatureDetailScreen />} />
            <Route path="/projects/:projectId/roadmap" element={<RoadmapScreen />} />
            <Route path="/projects/:projectId/versions" element={<VersionHistoryScreen />} />
            <Route path="/projects/:projectId/activity" element={<ActivityScreen />} />
            <Route path="/projects/:projectId/decisions" element={<DecisionLogScreen />} />
            <Route path="/projects/:projectId/dependencies" element={<DependenciesScreen />} />
            <Route path="/projects/:projectId/handoff" element={<HandoffScreen />} />
            <Route path="/projects/:projectId/settings" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MobileShell>
      </BrowserRouter>
    </InterviewStoreProvider>
  );
}

export default App;
