import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { modeLabels, phaseOrder } from '../mockData';
import { useInterviewStore } from '../store';
import type { Feature, Project, RoadmapLane } from '../types';
import { Button, Card, Header, Input, Pill, SectionTitle, Textarea } from '../components/ui';

function useProjectFromRoute(): Project | undefined {
  const { projectId = '' } = useParams();
  const { getProject } = useInterviewStore();
  return getProject(projectId);
}

function getRecommendedNextStep(project: Project): string {
  if (!project.vision) return 'Start Discovery';
  if (project.features.length < 2) return 'Add Feature';
  if (project.roadmap.MVP.length === 0) return 'Prioritize MVP';
  return 'Generate Handoff';
}

/**
 * Onboarding entry screen.
 */
export function OnboardingScreen() {
  return (
    <main className="flex min-h-dvh flex-col justify-between p-6">
      <div className="space-y-4 pt-8">
        <Pill text="AI Product Interviewer" />
        <h2 className="text-3xl font-semibold tracking-tight">A living AI-powered product operating system.</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Define your idea, evolve features, track decisions and versions, then export a developer-ready handoff from one unified AI assistant.
        </p>
      </div>
      <Link to="/projects" className="pb-4 pt-8"><Button className="w-full">Create your first project</Button></Link>
    </main>
  );
}

/**
 * Dashboard listing all projects and key metadata.
 */
export function DashboardScreen() {
  const { projects } = useInterviewStore();
  return (
    <div className="pb-20">
      <Header title="Projects" subtitle="AI product operating system" />
      <main className="space-y-3 p-4">
        <Link to="/projects/new"><Button className="w-full">+ New Project</Button></Link>
        {projects.length === 0 ? <Card><p className="text-sm text-slate-500">No projects yet. Create one to start discovery.</p></Card> : projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}/overview`}>
            <Card className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{project.name}</h3>
                <Pill text={project.status} />
              </div>
              <p className="text-sm text-slate-600">{project.description}</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                <p>Version: {project.currentVersion}</p>
                <p>Mode: {modeLabels[project.activeMode]}</p>
                <p>Last activity: {project.activity[0]?.title ?? 'No activity yet'}</p>
                <p>Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
              </div>
            </Card>
          </Link>
        ))}
      </main>
    </div>
  );
}

/**
 * Project creation form screen.
 */
export function CreateProjectScreen() {
  const navigate = useNavigate();
  const { createNewProject } = useInterviewStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div>
      <Header title="Create Project" subtitle="Capture the app concept" backTo="/projects" />
      <main className="space-y-3 p-4">
        <Card className="space-y-2">
          <label className="text-xs text-slate-500">Project name</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. AI PM Copilot" />
          <label className="text-xs text-slate-500">Description</label>
          <Textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What outcome should users get?" />
        </Card>
        <Button
          className="w-full"
          onClick={() => {
            if (!name.trim()) return;
            const project = createNewProject(name.trim(), description.trim());
            navigate(`/projects/${project.id}/overview`);
          }}
        >
          Start Interview
        </Button>
      </main>
    </div>
  );
}

/**
 * Project overview with control-center action bar.
 */
export function ProjectOverviewScreen() {
  const project = useProjectFromRoute();
  const { setMode, saveVersion, generateHandoff } = useInterviewStore();
  if (!project) return <Navigate to="/projects" replace />;

  const recommended = getRecommendedNextStep(project);

  return (
    <div className="pb-24">
      <Header title={project.name} subtitle={`Control Center • ${project.currentVersion}`} backTo="/projects" />
      <main className="space-y-3 p-4 text-sm">
        <Card className="space-y-2">
          <div className="flex items-center justify-between"><Pill text={project.status} /><Pill text={modeLabels[project.activeMode]} /></div>
          <p className="text-xs text-slate-500">Recommended next step: <span className="font-medium text-slate-700">{recommended}</span></p>
          <div className="grid grid-cols-2 gap-2">
            <Link to={`/projects/${project.id}/interview`}><Button variant="secondary" className="w-full" onClick={() => setMode(project.id, 'discovery')}>Start Discovery</Button></Link>
            <Link to={`/projects/${project.id}/features`}><Button variant="secondary" className="w-full" onClick={() => setMode(project.id, 'feature')}>Add Feature</Button></Link>
            <Link to={`/projects/${project.id}/roadmap`}><Button variant="ghost" className="w-full" onClick={() => setMode(project.id, 'prioritization')}>Prioritize</Button></Link>
            <Button variant="ghost" className="w-full" onClick={() => saveVersion(project.id, 'Saved from overview quick action.')}>Save Version</Button>
            <Button variant="primary" className="col-span-2 w-full" onClick={() => { generateHandoff(project.id); setMode(project.id, 'handoff'); }}>Generate Handoff</Button>
          </div>
        </Card>

        <QuickActionCard project={project} />
        <StructuredMemoryCard project={project} includeVersion />

        <Card className="space-y-2">
          <SectionTitle label="Project Sections" />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link to={`/projects/${project.id}/memory`}><Button variant="ghost" className="w-full">Structured Memory</Button></Link>
            <Link to={`/projects/${project.id}/features`}><Button variant="ghost" className="w-full">Feature List</Button></Link>
            <Link to={`/projects/${project.id}/roadmap`}><Button variant="ghost" className="w-full">Roadmap</Button></Link>
            <Link to={`/projects/${project.id}/versions`}><Button variant="ghost" className="w-full">Version History</Button></Link>
            <Link to={`/projects/${project.id}/activity`}><Button variant="ghost" className="w-full">Change Log</Button></Link>
            <Link to={`/projects/${project.id}/decisions`}><Button variant="ghost" className="w-full">Decision Log</Button></Link>
            <Link to={`/projects/${project.id}/dependencies`}><Button variant="ghost" className="w-full">Dependencies</Button></Link>
            <Link to={`/projects/${project.id}/handoff`}><Button variant="ghost" className="w-full">Developer Handoff</Button></Link>
            <Link to={`/projects/${project.id}/settings`}><Button variant="ghost" className="col-span-2 w-full">Settings</Button></Link>
          </div>
        </Card>
      </main>
    </div>
  );
}

/**
 * AI interview screen with active mode and memory toggle.
 */
export function InterviewScreen() {
  const project = useProjectFromRoute();
  const { sendChat, setMode } = useInterviewStore();
  const [input, setInput] = useState('');
  const [showMemory, setShowMemory] = useState(false);

  if (!project) return <Navigate to="/projects" replace />;

  const phaseIndex = phaseOrder.indexOf(project.interviewPhase);
  const progress = Math.round(((phaseIndex + 1) / phaseOrder.length) * 100);

  return (
    <div className="pb-20">
      <Header title="AI Assistant" subtitle={project.name} backTo={`/projects/${project.id}/overview`} />
      <main className="space-y-3 p-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <Pill text={modeLabels[project.activeMode]} />
            <span className="text-xs text-slate-500">Phase {project.interviewPhase}</span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-[11px]">
            {(['discovery', 'feature', 'prioritization', 'versioning', 'handoff'] as const).map((mode) => (
              <Button key={mode} variant={project.activeMode === mode ? 'secondary' : 'ghost'} className="px-2" onClick={() => setMode(project.id, mode)}>{mode.slice(0, 4)}</Button>
            ))}
          </div>
          <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="text-xs text-emerald-600">Input is being structured into memory and activity history.</p>
          <Button variant="ghost" className="w-full" onClick={() => setShowMemory((prev) => !prev)}>{showMemory ? 'Hide' : 'Show'} structured memory</Button>
        </Card>

        <Card className="max-h-[38dvh] space-y-2 overflow-y-auto">
          {project.chatMessages.map((message) => (
            <div key={message.id} className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm ${message.role === 'assistant' ? 'bg-slate-100 text-slate-700' : 'ml-auto bg-slate-900 text-white'}`}>
              <p>{message.content}</p>
              <p className="mt-1 text-[10px] opacity-70">{modeLabels[message.mode]}</p>
            </div>
          ))}
        </Card>

        <div className="flex flex-wrap gap-2">
          {[
            'Let me clarify that.',
            'Who is this feature for?',
            'Is this part of MVP or later?',
            'Would you like to save this as a new project version?',
            'Generate developer handoff',
          ].map((chip) => (
            <button key={chip} onClick={() => sendChat(project.id, chip)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">{chip}</button>
          ))}
        </div>

        <Card className="space-y-2">
          <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Share details, decisions, or scope changes..." />
          <Button className="w-full" onClick={() => { if (input.trim()) { sendChat(project.id, input.trim()); setInput(''); } }}>Send</Button>
        </Card>

        {showMemory ? <StructuredMemoryCard project={project} includeVersion /> : null}
      </main>
    </div>
  );
}

/**
 * Dedicated structured memory view.
 */
export function StructuredMemoryScreen() {
  const project = useProjectFromRoute();
  if (!project) return <Navigate to="/projects" replace />;
  return (
    <div className="pb-16">
      <Header title="Structured Memory" subtitle="Live project state" backTo={`/projects/${project.id}/overview`} />
      <main className="p-4"><StructuredMemoryCard project={project} includeVersion /></main>
    </div>
  );
}

/**
 * Feature list grouped by roadmap buckets.
 */
export function FeatureListScreen() {
  const project = useProjectFromRoute();
  const { addFeature, setMode } = useInterviewStore();
  if (!project) return <Navigate to="/projects" replace />;

  const lanes: RoadmapLane[] = ['MVP', 'Next', 'Later', 'Maybe'];

  return (
    <div className="pb-16">
      <Header title="Feature List" subtitle={`${project.features.length} features`} backTo={`/projects/${project.id}/overview`} />
      <main className="space-y-3 p-4">
        <Button className="w-full" onClick={() => {
          setMode(project.id, 'feature');
          addFeature(project.id, {
            name: 'New feature from quick action',
            description: 'Captured from assistant-guided feature mode.',
            goal: 'Expand product capability without losing focus.',
            userValue: 'Users evolve roadmap with structure.',
            priority: 'P1',
            status: 'Drafting',
            dependencies: [],
            notes: 'Auto-generated starter feature.',
            decisionIds: [],
          });
        }}>+ Add Feature</Button>

        {lanes.map((lane) => (
          <Card key={lane} className="space-y-2">
            <SectionTitle label={lane} />
            {project.roadmap[lane].length === 0 ? <p className="text-xs text-slate-400">No features in this bucket.</p> : project.roadmap[lane].map((featureId) => {
              const feature = project.features.find((entry) => entry.id === featureId);
              if (!feature) return null;
              return (
                <Link key={feature.id} to={`/projects/${project.id}/features/${feature.id}`} className="block rounded-xl border border-slate-100 p-3">
                  <p className="text-sm font-medium">{feature.name}</p>
                  <p className="text-xs text-slate-500">{feature.priority} • {feature.status}</p>
                </Link>
              );
            })}
          </Card>
        ))}
      </main>
    </div>
  );
}

/**
 * Feature detail with decision and history context.
 */
export function FeatureDetailScreen() {
  const project = useProjectFromRoute();
  const { featureId = '' } = useParams();
  const { updateFeature, setMode } = useInterviewStore();
  const navigate = useNavigate();

  const feature = project?.features.find((item) => item.id === featureId);
  if (!project || !feature) return <Navigate to="/projects" replace />;

  const relatedDecisions = project.decisions.filter((decision) => decision.linkedFeatureIds.includes(feature.id) || feature.decisionIds.includes(decision.id));

  return (
    <div className="pb-16">
      <Header title={feature.name} subtitle="Feature detail" backTo={`/projects/${project.id}/features`} />
      <main className="space-y-3 p-4 text-sm">
        <FeatureCard feature={feature} relatedDecisions={relatedDecisions.map((entry) => entry.title)} />
        <Card className="space-y-2">
          <SectionTitle label="Actions" />
          <Button className="w-full" onClick={() => { setMode(project.id, 'feature'); navigate(`/projects/${project.id}/interview`); }}>Refine with AI</Button>
          <Button variant="secondary" className="w-full" onClick={() => updateFeature(project.id, feature.id, { priority: 'P0' })}>Reprioritize to P0</Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate(`/projects/${project.id}/dependencies`)}>View dependencies</Button>
        </Card>
      </main>
    </div>
  );
}

/**
 * Roadmap / prioritization screen.
 */
export function RoadmapScreen() {
  const project = useProjectFromRoute();
  const { moveRoadmapItem, setMode } = useInterviewStore();
  if (!project) return <Navigate to="/projects" replace />;

  const lanes: RoadmapLane[] = ['MVP', 'Next', 'Later', 'Maybe'];

  return (
    <div className="pb-16">
      <Header title="Roadmap" subtitle="Prioritization buckets" backTo={`/projects/${project.id}/overview`} />
      <main className="space-y-3 p-4">
        <Button variant="secondary" className="w-full" onClick={() => setMode(project.id, 'prioritization')}>Enter Prioritization Mode</Button>
        {lanes.map((lane) => (
          <Card key={lane} className="space-y-2">
            <SectionTitle label={lane} />
            {project.roadmap[lane].length === 0 ? <p className="text-xs text-slate-400">No features yet.</p> : project.roadmap[lane].map((featureId) => {
              const feature = project.features.find((item) => item.id === featureId);
              if (!feature) return null;
              return (
                <div key={featureId} className="rounded-xl border border-slate-100 p-3 text-sm">
                  <p className="font-medium">{feature.name}</p>
                  <p className="text-xs text-slate-500">{feature.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lanes.filter((next) => next !== lane).map((nextLane) => (
                      <button key={nextLane} onClick={() => moveRoadmapItem(project.id, featureId, nextLane)} className="rounded-full bg-slate-100 px-2 py-1 text-[11px]">
                        Move to {nextLane}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>
        ))}
      </main>
    </div>
  );
}

/**
 * Version timeline with restore support.
 */
export function VersionHistoryScreen() {
  const project = useProjectFromRoute();
  const { saveVersion, restoreVersion, setMode } = useInterviewStore();
  if (!project) return <Navigate to="/projects" replace />;

  return (
    <div className="pb-16">
      <Header title="Version History" subtitle={`Current: ${project.currentVersion}`} backTo={`/projects/${project.id}/overview`} />
      <main className="space-y-3 p-4">
        <Button className="w-full" onClick={() => { setMode(project.id, 'versioning'); saveVersion(project.id, 'Checkpoint created after product updates.'); }}>Save Version</Button>
        {project.versions.map((version) => (
          <Card key={version.id} className="space-y-2">
            <div className="flex items-center justify-between"><p className="font-medium">{version.label}</p><span className="text-xs text-slate-400">{new Date(version.createdAt).toLocaleDateString()}</span></div>
            <p className="text-sm text-slate-600">{version.summary}</p>
            <ul className="list-disc pl-4 text-xs text-slate-500">{version.changedItems.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost">View Version</Button>
              <Button variant="ghost" onClick={() => restoreVersion(project.id, version.id)}>Restore Version</Button>
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
}

/**
 * Activity/change log screen.
 */
export function ActivityScreen() {
  const project = useProjectFromRoute();
  if (!project) return <Navigate to="/projects" replace />;
  return (
    <div className="pb-16">
      <Header title="Change Log" subtitle="Chronological updates" backTo={`/projects/${project.id}/overview`} />
      <main className="space-y-3 p-4">
        {project.activity.map((entry) => (
          <Card key={entry.id} className="space-y-1 text-sm">
            <p className="font-medium">{entry.title}</p>
            <p className="text-slate-600">Reason: {entry.reason}</p>
            <p className="text-xs text-slate-500">Impact: {entry.impact}</p>
            <p className="text-xs text-slate-400">{new Date(entry.date).toLocaleString()}</p>
          </Card>
        ))}
      </main>
    </div>
  );
}

/**
 * Decision log screen.
 */
export function DecisionLogScreen() {
  const project = useProjectFromRoute();
  const { addDecision } = useInterviewStore();
  if (!project) return <Navigate to="/projects" replace />;
  return (
    <div className="pb-16">
      <Header title="Decision Log" subtitle="Strategic choices" backTo={`/projects/${project.id}/overview`} />
      <main className="space-y-3 p-4">
        <Button className="w-full" onClick={() => addDecision(project.id, 'Prioritize onboarding simplification', 'Reduce first-run friction in discovery mode.', 'Higher activation in week one.')}>+ Add Decision</Button>
        {project.decisions.map((decision) => (
          <Card key={decision.id} className="space-y-1 text-sm">
            <p className="font-medium">{decision.title}</p>
            <p className="text-slate-600">{decision.reasoning}</p>
            <p className="text-xs text-slate-500">Impact: {decision.impact}</p>
            <p className="text-xs text-slate-400">Linked features: {decision.linkedFeatureIds.join(', ') || 'None'}</p>
          </Card>
        ))}
      </main>
    </div>
  );
}

/**
 * Readable mobile dependency view.
 */
export function DependenciesScreen() {
  const project = useProjectFromRoute();
  if (!project) return <Navigate to="/projects" replace />;
  return (
    <div className="pb-16">
      <Header title="Dependencies" subtitle="Feature relationships" backTo={`/projects/${project.id}/overview`} />
      <main className="space-y-3 p-4">
        {project.features.map((feature) => (
          <Card key={feature.id} className="space-y-1 text-sm">
            <p className="font-medium">{feature.name}</p>
            <p className="text-slate-500">Depends on: {feature.dependencies.length ? feature.dependencies.join(', ') : 'No dependencies'}</p>
          </Card>
        ))}
      </main>
    </div>
  );
}

/**
 * Developer export-ready handoff screen.
 */
export function HandoffScreen() {
  const project = useProjectFromRoute();
  const { generateHandoff, setMode } = useInterviewStore();
  if (!project) return <Navigate to="/projects" replace />;
  return (
    <div className="pb-16">
      <Header title="Developer Handoff" subtitle="Build-ready summary" backTo={`/projects/${project.id}/overview`} />
      <main className="space-y-3 p-4 text-sm">
        <Button className="w-full" onClick={() => { setMode(project.id, 'handoff'); generateHandoff(project.id); }}>Refresh Handoff</Button>
        <Card><SectionTitle label="Product Overview" /><p className="mt-2">{project.vision || 'Pending vision'}</p></Card>
        <Card><SectionTitle label="Target Users" /><p className="mt-2">{project.targetUsers.join(', ') || 'Pending users'}</p></Card>
        <Card><SectionTitle label="Problem" /><p className="mt-2">{project.problem || 'Pending problem'}</p></Card>
        <Card><SectionTitle label="Features" /><ul className="mt-2 list-disc pl-4">{project.features.map((feature) => <li key={feature.id}>{feature.name}: {feature.description}</li>)}</ul></Card>
        <Card><SectionTitle label="MVP Scope" /><p className="mt-2">{project.mvpScope.join(', ') || 'Pending'}</p></Card>
        <Card><SectionTitle label="Roadmap Snapshot" /><p className="mt-2">MVP {project.roadmap.MVP.length} • Next {project.roadmap.Next.length} • Later {project.roadmap.Later.length} • Maybe {project.roadmap.Maybe.length}</p></Card>
        <Card><SectionTitle label="User Flow" /><p className="mt-2">{project.userFlow.join(' → ') || 'Pending'}</p></Card>
        <Card><SectionTitle label="Open Questions" /><p className="mt-2">{project.openQuestions.join(', ') || 'None'}</p></Card>
        <Card><SectionTitle label="Decisions" /><p className="mt-2">{project.decisions.map((decision) => decision.title).join(', ') || 'None'}</p></Card>
        <Card><SectionTitle label="Current Version" /><p className="mt-2">{project.currentVersion}</p></Card>
        <Card><SectionTitle label="Generated Summary" /><pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-slate-600">{project.developerSummary || 'No handoff summary yet.'}</pre></Card>
        <div className="grid grid-cols-3 gap-2"><Button variant="secondary">Export</Button><Button variant="secondary">Copy</Button><Button variant="secondary">Share</Button></div>
      </main>
    </div>
  );
}

/**
 * Project settings screen.
 */
export function SettingsScreen() {
  const project = useProjectFromRoute();
  const navigate = useNavigate();
  const { renameProject, resetInterview, deleteProject } = useInterviewStore();
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');

  if (!project) return <Navigate to="/projects" replace />;

  return (
    <div className="pb-16">
      <Header title="Project Settings" subtitle={project.name} backTo={`/projects/${project.id}/overview`} />
      <main className="space-y-3 p-4">
        <Card className="space-y-2">
          <label className="text-xs text-slate-500">Rename project</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
          <label className="text-xs text-slate-500">Edit description</label>
          <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          <Button onClick={() => renameProject(project.id, name.trim(), description.trim())}>Save</Button>
        </Card>
        <Card className="space-y-2">
          <Button variant="ghost" onClick={() => resetInterview(project.id)}>Reset Interview</Button>
          <Button variant="danger" onClick={() => { deleteProject(project.id); navigate('/projects'); }}>Delete Project</Button>
        </Card>
      </main>
    </div>
  );
}

function QuickActionCard({ project }: { project: Project }) {
  return (
    <Card className="space-y-2">
      <SectionTitle label="Quick Action Entry" />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Link to={`/projects/${project.id}/interview`}><Button variant="ghost" className="w-full">Define App Idea</Button></Link>
        <Link to={`/projects/${project.id}/features`}><Button variant="ghost" className="w-full">Add Feature</Button></Link>
        <Link to={`/projects/${project.id}/roadmap`}><Button variant="ghost" className="w-full">Reprioritize</Button></Link>
        <Link to={`/projects/${project.id}/versions`}><Button variant="ghost" className="w-full">Save Version</Button></Link>
        <Link to={`/projects/${project.id}/handoff`}><Button variant="ghost" className="col-span-2 w-full">Generate Developer Output</Button></Link>
      </div>
    </Card>
  );
}

function StructuredMemoryCard({ project, includeVersion = false }: { project: Project; includeVersion?: boolean }) {
  return (
    <Card className="space-y-3 text-sm">
      <SectionTitle label="Structured Memory" />
      <MemoryRow label="Vision" value={project.vision || 'Pending'} />
      <MemoryRow label="Problem" value={project.problem || 'Pending'} />
      <MemoryRow label="Users" value={project.targetUsers.join(', ') || 'Pending'} />
      <MemoryRow label="Features" value={project.features.map((feature) => feature.name).join(', ') || 'Pending'} />
      <MemoryRow label="MVP" value={project.mvpScope.join(', ') || 'Pending'} />
      <MemoryRow label="Future Ideas" value={project.futureIdeas.join(', ') || 'Pending'} />
      <MemoryRow label="Open Questions" value={project.openQuestions.join(', ') || 'None'} />
      <MemoryRow label="Decisions" value={project.decisions.map((decision) => decision.title).join(', ') || 'None'} />
      {includeVersion ? <MemoryRow label="Current Version Summary" value={`${project.currentVersion} • ${project.versions[0]?.summary ?? 'No snapshot yet'}`} /> : null}
    </Card>
  );
}

function MemoryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-slate-700">{value}</p>
    </div>
  );
}

function FeatureCard({ feature, relatedDecisions }: { feature: Feature; relatedDecisions: string[] }) {
  return (
    <Card className="space-y-2">
      <MemoryRow label="Description" value={feature.description} />
      <MemoryRow label="Goal" value={feature.goal} />
      <MemoryRow label="User value" value={feature.userValue} />
      <MemoryRow label="Priority" value={feature.priority} />
      <MemoryRow label="Status" value={feature.status} />
      <MemoryRow label="Dependencies" value={feature.dependencies.join(', ') || 'None'} />
      <MemoryRow label="Notes" value={feature.notes} />
      <MemoryRow label="Related decisions" value={relatedDecisions.join(', ') || 'None'} />
      <MemoryRow label="Change history" value={feature.history.join(' • ') || 'No history yet'} />
    </Card>
  );
}
