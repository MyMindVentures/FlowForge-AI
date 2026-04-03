import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bug, CheckCircle2, FileCode2, FlaskConical, ListChecks, RefreshCcw, ShieldAlert, Sparkles, Wrench } from 'lucide-react';
import { motion } from 'motion/react';
import { orderBy, limit } from 'firebase/firestore';
import { CodeReliabilityObject, CodeReliabilitySnapshot, Feature, Task, UIComponent, UIPage } from '../../types';
import { cn } from '../../lib/utils';
import { useFirestore } from '../../hooks/useFirestore';
import { CodeReliabilityService } from '../../services/codeReliabilityService';

type Props = {
  projectId: string;
  pages: UIPage[];
  components: UIComponent[];
  features: Feature[];
  tasks: Task[];
};

const badgeTone: Record<CodeReliabilityObject['severity'], string> = {
  Low: 'text-sky-300 bg-sky-500/10 border-sky-400/20',
  Medium: 'text-amber-300 bg-amber-500/10 border-amber-400/20',
  High: 'text-orange-300 bg-orange-500/10 border-orange-400/20',
  Critical: 'text-rose-300 bg-rose-500/10 border-rose-400/20'
};

export default function CodeReliabilityWorkspace({ projectId, pages, components, features, tasks }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const objectsPath = `projects/${projectId}/codeReliabilityObjects`;
  const snapshotsPath = `projects/${projectId}/codeReliabilitySnapshots`;

  const { data: queue, set: setObject } = useFirestore<CodeReliabilityObject>(objectsPath, [orderBy('updatedAt', 'desc')]);
  const { data: snapshots, add: addSnapshot } = useFirestore<CodeReliabilitySnapshot>(snapshotsPath, [orderBy('checkedAt', 'desc'), limit(8)]);

  const latestSnapshot = snapshots[0];
  const selected = queue.find((item) => item.id === selectedId) ?? queue[0];

  const runVerification = async () => {
    setIsRunning(true);
    try {
      const { objects, snapshot } = CodeReliabilityService.buildVerification(projectId, pages, components, features, tasks);
      await Promise.all(objects.map((item) => setObject(item.id, item)));
      await addSnapshot(snapshot);
      if (!selectedId && objects[0]) {
        setSelectedId(objects[0].id);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const productionFlags = useMemo(() => {
    const blockers = queue.filter((item) => item.severity === 'Critical' && item.status === 'open').slice(0, 5);
    const unstableModules = queue.filter((item) => item.placeholderState !== 'clean').slice(0, 5);
    const failingPages = queue.filter((item) => item.relatedPage && item.testState !== 'passing').slice(0, 5);

    return {
      blockers,
      unstableModules,
      failingPages
    };
  }, [queue]);

  const updateStatus = async (id: string, status: CodeReliabilityObject['status']) => {
    await setObject(id, {
      ...(queue.find((item) => item.id === id) as CodeReliabilityObject),
      status,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">Code Reliability Workspace</h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Continuous verification and definition-of-done operations.</p>
        </div>
        <button
          onClick={runVerification}
          disabled={isRunning}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-400/20 hover:bg-indigo-500/25 transition disabled:opacity-60"
        >
          <RefreshCcw size={16} className={cn(isRunning && 'animate-spin')} />
          {isRunning ? 'Running Verification…' : 'Rerun Verification'}
        </button>
      </div>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Total Files Checked', value: latestSnapshot?.totalFilesChecked ?? 0, icon: FileCode2 },
          { label: 'Total Functions Checked', value: latestSnapshot?.totalFunctionsChecked ?? 0, icon: ListChecks },
          { label: 'Test Pass / Fail', value: `${latestSnapshot?.testPassCount ?? 0} / ${latestSnapshot?.testFailCount ?? 0}`, icon: FlaskConical },
          { label: 'Missing Comments', value: latestSnapshot?.missingCommentsCount ?? 0, icon: Bug },
          { label: 'Placeholders', value: latestSnapshot?.placeholderDetections ?? 0, icon: AlertTriangle },
          { label: 'DoD Status', value: latestSnapshot?.definitionOfDoneStatus ?? 'unknown', icon: CheckCircle2 },
          { label: 'Release Risk', value: latestSnapshot?.productionReadiness.releaseRisk ?? 'Unknown', icon: ShieldAlert },
          { label: 'Out-of-sync', value: latestSnapshot?.productionReadiness.outOfSyncRecords ?? 0, icon: Sparkles }
        ].map((card) => (
          <div key={card.label} className="rounded-2xl bg-gradient-to-b from-[#12141c] to-[#0d0f15] border border-white/10 p-4 shadow-lg">
            <card.icon className="text-indigo-300" size={17} />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-3">{card.label}</p>
            <p className="text-lg sm:text-2xl font-bold text-white mt-1 break-all">{card.value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section className="xl:col-span-5 rounded-3xl border border-white/10 bg-[#0f1118] p-4">
          <h4 className="text-white font-semibold mb-3">Verification Queue</h4>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {queue.filter((item) => item.status !== 'resolved').map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  'w-full text-left rounded-xl border p-3 transition',
                  selected?.id === item.id ? 'border-indigo-400/40 bg-indigo-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-white font-medium">{item.objectName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.issueType.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{item.relatedFeature || item.relatedPage || item.relatedComponent || 'Unlinked object'}</p>
                  </div>
                  <span className={cn('px-2 py-0.5 text-[10px] rounded-md border font-bold', badgeTone[item.severity])}>{item.severity}</span>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                  <span>Status: {item.status}</span>
                  <span>{new Date(item.lastCheckedAt).toLocaleString()}</span>
                </div>
              </button>
            ))}
            {queue.length === 0 && <p className="text-sm text-gray-500 italic py-8 text-center">No verification data yet. Run verification.</p>}
          </div>
        </section>

        <section className="xl:col-span-7 rounded-3xl border border-white/10 bg-[#0f1118] p-4 space-y-4">
          <h4 className="text-white font-semibold">Code Object Detail View</h4>
          {selected ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <Detail label="File Path" value={selected.filePath} />
                <Detail label="Object" value={`${selected.objectType} • ${selected.objectName}`} />
                <Detail label="Implementation State" value={selected.implementationState} />
                <Detail label="Comments State" value={selected.commentsState} />
                <Detail label="Test State" value={selected.testState} />
                <Detail label="Placeholder State" value={selected.placeholderState} />
                <Detail label="Related" value={selected.relatedFeature || selected.relatedPage || selected.relatedComponent || 'None'} />
                <Detail label="Error Details" value={selected.errorDetails || 'None'} />
              </div>

              <div className="rounded-2xl bg-[#141926] border border-white/10 p-3">
                <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Definition-of-Done Panel</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(selected.definitionOfDone).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-2">
                      <span className="text-gray-300">{key.replace(/[A-Z]/g, (m) => ` ${m}`).trim()}</span>
                      <span className={value ? 'text-emerald-300' : 'text-rose-300'}>{value ? 'Yes' : 'No'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Repair / Retry Actions</p>
                <div className="flex flex-wrap gap-2">
                  <ActionButton label="Rerun verification" icon={RefreshCcw} onClick={runVerification} />
                  <ActionButton label="Regenerate tests" icon={FlaskConical} onClick={() => updateStatus(selected.id, 'in_progress')} />
                  <ActionButton label="Regenerate comments" icon={FileCode2} onClick={() => updateStatus(selected.id, 'in_progress')} />
                  <ActionButton label="Retry failed checks" icon={Wrench} onClick={() => updateStatus(selected.id, 'in_progress')} />
                  <ActionButton label="Open linked feature/page/task" icon={Sparkles} onClick={() => setSelectedId(selected.id)} />
                </div>
              </div>
            </motion.div>
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">Select a queue item to inspect details.</p>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#0f1118] p-4">
        <h4 className="text-white font-semibold mb-3">Production Readiness View</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 text-xs">
          <ReadinessCard title="Blockers" items={productionFlags.blockers.map((i) => i.objectName)} />
          <ReadinessCard title="Unstable modules" items={productionFlags.unstableModules.map((i) => i.filePath)} />
          <ReadinessCard title="Failing pages" items={productionFlags.failingPages.map((i) => i.relatedPage || i.objectName)} />
          <ReadinessCard title="Out-of-sync records" items={[String(latestSnapshot?.productionReadiness.outOfSyncRecords ?? 0)]} />
          <ReadinessCard title="Release risk" items={[latestSnapshot?.productionReadiness.releaseRisk ?? 'Unknown']} />
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
      <p className="text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
      <p className="text-gray-200 mt-1 break-all">{value}</p>
    </div>
  );
}

function ActionButton({ label, icon: Icon, onClick }: { label: string; icon: React.ComponentType<{ size?: number }>; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-2 text-xs text-gray-200">
      <Icon size={14} />
      {label}
    </button>
  );
}

function ReadinessCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{title}</p>
      <div className="space-y-1">
        {items.length > 0 ? items.slice(0, 3).map((item) => (
          <p key={item} className="text-gray-200 truncate" title={item}>• {item}</p>
        )) : <p className="text-gray-500 italic">No issues</p>}
      </div>
    </div>
  );
}
