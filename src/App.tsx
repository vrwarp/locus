import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GradeScatter } from './components/GradeScatter'
import { SmartFixModal } from './components/SmartFixModal'
import { ReviewMode } from './components/ReviewMode'
import { ConfigModal } from './components/ConfigModal'
import { GhostModal } from './components/GhostModal'
import { FamilyModal } from './components/FamilyModal'
import { UndoToast } from './components/UndoToast'
import { RobertReport } from './components/RobertReport'
import { GamificationWidget } from './components/GamificationWidget'
import { UndoRedoControls } from './components/UndoRedoControls'
import { transformPerson, fetchAllPeople, archivePerson, fetchCheckInCount, fetchGroupCount, checkApiVersion } from './utils/pco'
import { isGhost } from './utils/ghost'
import { analyzeFamilies } from './utils/family'
import { loadConfig, saveConfig, loadHealthHistory, saveHealthSnapshot, loadGamificationState, saveGamificationState } from './utils/storage'
import { updateGamificationState } from './utils/gamification'
import { saveToCache, loadFromCache } from './utils/cache'
import { calculateHealthStats } from './utils/analytics'
import { Confetti } from './components/Confetti'
import { BadgeToast } from './components/BadgeToast'
import { CommandManager } from './utils/commands'
import { UpdateStudentCommand } from './commands/UpdateStudentCommand'
import type { AppConfig, HealthHistoryEntry, GamificationState } from './utils/storage'
import type { Student, PcoPerson } from './utils/pco'
import type { Badge } from './utils/gamification'
import './App.css'

function App() {
  const [appId, setAppId] = useState('')
  const [secret, setSecret] = useState('')
  const [config, setConfig] = useState<AppConfig>({ graderOptions: {} });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isGhostModalOpen, setIsGhostModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReviewModeOpen, setIsReviewModeOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const auth = useMemo(() => {
    if (appId && secret) return btoa(`${appId}:${secret}`);
    return '';
  }, [appId, secret]);

  // Command Manager state
  const commandManagerRef = useRef<CommandManager>(new CommandManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // API Status state
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [apiError, setApiError] = useState<string | null>(null);

  // State for report history
  const [healthHistory, setHealthHistory] = useState<HealthHistoryEntry[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // State for gamification
  const [gamificationState, setGamificationState] = useState<GamificationState>({
      lastActiveDate: '',
      currentStreak: 0,
      dailyFixes: 0,
      totalFixes: 0,
      unlockedBadges: []
  });
  const [latestBadge, setLatestBadge] = useState<Badge | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Pending update state for UI (Toast)
  const [pendingUpdateUI, setPendingUpdateUI] = useState<{ original: Student, updated: Student } | null>(null)

  // Ref to track the active pending update and its timer for logic management
  const pendingUpdateRef = useRef<{
    original: Student,
    updated: Student,
    prevGamificationState: GamificationState,
    timer: ReturnType<typeof setTimeout>
  } | null>(null);

  const queryClient = useQueryClient()

  // Load config when appId changes
  useEffect(() => {
    if (!appId) return;

    const load = async () => {
      try {
        const loadedConfig = await loadConfig(appId);
        setConfig(loadedConfig);
        const loadedHistory = await loadHealthHistory(appId);
        setHealthHistory(loadedHistory);
        const loadedGamification = await loadGamificationState(appId);
        setGamificationState(loadedGamification);
      } catch (e) {
        console.error("Error loading config/history", e);
      }
    };

    // Debounce slightly to allow typing
    const timer = setTimeout(load, 500);
    return () => clearTimeout(timer);
  }, [appId]);

  // Apply High Contrast Mode to body
  useEffect(() => {
    if (config.highContrastMode) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [config.highContrastMode]);

  // Cleanup timer on unmount
  useEffect(() => {
      return () => {
          if (pendingUpdateRef.current) {
              clearTimeout(pendingUpdateRef.current.timer);
          }
      }
  }, []);

  // Check API version/credentials
  useEffect(() => {
    if (appId && secret) {
      const check = async () => {
        setApiStatus('checking');
        setApiError(null);
        try {
          const auth = btoa(`${appId}:${secret}`);
          await checkApiVersion(auth);
          setApiStatus('ok');
        } catch (e: any) {
          setApiStatus('error');
          setApiError(e.message || 'Unknown API Error');
        }
      };
      // Debounce slightly to avoid rapid checks while typing
      const timer = setTimeout(check, 1000);
      return () => clearTimeout(timer);
    } else {
        setApiStatus('idle');
        setApiError(null);
    }
  }, [appId, secret]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['people', appId, secret, config],
    queryFn: async () => {
      if (!appId || !secret) return { students: [], nextUrl: undefined, raw: [] };

      const cacheKey = `people_v2_${appId}`;
      const auth = btoa(`${appId}:${secret}`)

      let cached = await loadFromCache<{ people: PcoPerson[], nextUrl: string | undefined } | PcoPerson[]>(cacheKey, appId, 5 * 60 * 1000); // 5 mins TTL

      let people: PcoPerson[] = [];
      let nextUrl: string | undefined = undefined;

      if (cached) {
          if (Array.isArray(cached)) {
              people = cached;
          } else {
              people = cached.people;
              nextUrl = cached.nextUrl;
          }
      } else {
        const res = await fetchAllPeople(auth, undefined, 5);
        people = res.people;
        nextUrl = res.nextUrl;
        await saveToCache(cacheKey, { people, nextUrl }, appId);
      }

      const students = people
        .map(p => transformPerson(p, config.graderOptions))
        .filter((s): s is Student => s !== null)

      return { students, nextUrl, raw: people };
    },
    enabled: !!appId && !!secret && apiStatus === 'ok',
    retry: false
  })

  const students = data?.students || [];
  const nextUrl = data?.nextUrl;

  // Calculate stats
  const stats = useMemo(() => calculateHealthStats(students), [students]);

  // Update history snapshot logic
  useEffect(() => {
      if (students.length > 0 && appId) {
          const checkSnapshot = async () => {
            const currentHistory = await loadHealthHistory(appId);
            const today = new Date().setHours(0, 0, 0, 0);
            const hasSnapshotToday = currentHistory.some(h => new Date(h.timestamp).setHours(0, 0, 0, 0) === today);

            if (!hasSnapshotToday) {
                await saveHealthSnapshot(stats, appId);
                setHealthHistory(await loadHealthHistory(appId));
            } else {
                setHealthHistory(currentHistory);
            }
          };
          checkSnapshot();
      }
  }, [students, stats, appId]);

  const ghosts = students.filter(s => isGhost(s));
  const anomalies = students.filter(s => s.delta !== 0 || s.hasNameAnomaly || s.hasEmailAnomaly || s.hasAddressAnomaly || s.hasPhoneAnomaly);

  const familyIssues = useMemo(() => analyzeFamilies(students), [students]);

  const handleAnalyzeGhosts = async (ghostsToAnalyze: Student[]) => {
      const auth = btoa(`${appId}:${secret}`);

      // Fetch Check-in Count AND Group Count
      const updates = await Promise.all(ghostsToAnalyze.map(async (ghost) => {
          const [checkInCount, groupCount] = await Promise.all([
              fetchCheckInCount(ghost.id, auth),
              fetchGroupCount(ghost.id, auth)
          ]);
          return { id: ghost.id, checkInCount, groupCount };
      }));

      queryClient.setQueryData(['people', appId, secret, config], (oldData: any) => {
          if (!oldData) return oldData;
          const newStudents = oldData.students.map((s: Student) => {
              const update = updates.find(u => u.id === s.id);
              if (update) {
                  return {
                      ...s,
                      checkInCount: update.checkInCount ?? 0,
                      groupCount: update.groupCount ?? 0
                  };
              }
              return s;
          });
          return { ...oldData, students: newStudents };
      });
  };

  const handleArchiveGhosts = async (ghostsToArchive: Student[]) => {
      setIsArchiving(true);
      const auth = btoa(`${appId}:${secret}`);

      let successCount = 0;
      for (const ghost of ghostsToArchive) {
          try {
              await archivePerson(ghost.id, auth, config.sandboxMode);
              successCount++;
          } catch (e) {
              console.error(`Failed to archive ${ghost.name}`, e);
          }
      }

      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ['people', appId, secret, config] });
      setIsArchiving(false);
      setIsGhostModalOpen(false);
      if (successCount > 0) {
          alert(`Successfully archived ${successCount} ghosts.`);
      } else {
          alert('Failed to archive ghosts. Check console/network.');
      }
  }

  // Function to actually execute the API call
  const executeCommit = async (update: { original: Student, updated: Student }) => {
      try {
           const auth = btoa(`${appId}:${secret}`);
           console.log(`Committing change for ${update.updated.name} to PCO...`);

           const onStateChange = (student: Student) => {
               queryClient.setQueryData(['people', appId, secret, config], (oldData: any) => {
                  if (!oldData) return oldData;
                  const newStudents = oldData.students.map((s: Student) => s.id === student.id ? student : s);
                  return { ...oldData, students: newStudents };
              });
           };

           const command = new UpdateStudentCommand(
               update.original,
               update.updated,
               auth,
               config.sandboxMode || false,
               onStateChange
           );

           // Execute the command (calls API)
           await command.execute();
           console.log('Successfully saved to PCO');

           // Add to history
           commandManagerRef.current.execute(command);
           setCanUndo(commandManagerRef.current.canUndo);
           setCanRedo(commandManagerRef.current.canRedo);

      } catch (error) {
          console.error('Failed to save to PCO', error);
          // Revert on error
           queryClient.setQueryData(['people', appId, secret, config], (oldData: any) => {
              if (!oldData) return oldData;
              const newStudents = oldData.students.map((s: Student) => s.id === update.original.id ? update.original : s);
              return { ...oldData, students: newStudents };
          });
          alert(`Failed to save changes for ${update.updated.name}. The change has been reverted.`);
      }
  };

  const handleLoadMore = async () => {
      if (!nextUrl || !appId || !secret) return;

      setIsLoadingMore(true);
      const auth = btoa(`${appId}:${secret}`);
      const cacheKey = `people_v2_${appId}`;

      try {
          const res = await fetchAllPeople(auth, nextUrl, 5);

          // Update Cache (React Query + IDB)
          queryClient.setQueryData(['people', appId, secret, config], (old: any) => {
             if (!old) return old;
             // Merge
             const newRaw = [...old.raw, ...res.people];
             const newStudents = res.people
                .map((p: PcoPerson) => transformPerson(p, config.graderOptions))
                .filter((s: Student | null): s is Student => s !== null);

             const combinedStudents = [...old.students, ...newStudents];

             // Save to IDB
             saveToCache(cacheKey, { people: newRaw, nextUrl: res.nextUrl }, appId);

             return {
                 students: combinedStudents,
                 nextUrl: res.nextUrl,
                 raw: newRaw
             };
          });

      } catch (e) {
          console.error("Failed to load more", e);
          alert("Failed to load more records.");
      } finally {
          setIsLoadingMore(false);
      }
  }

  const handleSaveStudent = (updatedStudent: Student) => {
    // 1. If there is an existing pending update, flush it immediately
    if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current.timer);
        const previousUpdate = {
            original: pendingUpdateRef.current.original,
            updated: pendingUpdateRef.current.updated
        };
        // Commit immediately
        executeCommit(previousUpdate);
        // Clear ref immediately so we don't double process
        pendingUpdateRef.current = null;
    }

    // Find original student for revert
    const originalStudent = students.find(s => s.id === updatedStudent.id);
    if (!originalStudent) return;

    // Update gamification state optimistically
    const prevGamificationState = gamificationState;
    const { newState: newGamificationState, newBadges } = updateGamificationState(gamificationState);
    setGamificationState(newGamificationState);

    if (newBadges.length > 0) {
        setLatestBadge(newBadges[0]);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
    }

    // Persist gamification state (fire and forget - but if undo happens we will revert via UI state, persistence might need revert too but it's minor)
    saveGamificationState(newGamificationState, appId);

    // Optimistically update the cache
    queryClient.setQueryData(['people', appId, secret, config], (oldData: any) => {
        if (!oldData) return oldData
        const newStudents = oldData.students.map((s: Student) => s.id === updatedStudent.id ? updatedStudent : s)
        return { ...oldData, students: newStudents };
    })

    // 2. Set up new pending update
    const newPending = { original: originalStudent, updated: updatedStudent, prevGamificationState };

    const timer = setTimeout(() => {
        // Prevent undo while committing
        pendingUpdateRef.current = null;
        setPendingUpdateUI(null);
        executeCommit(newPending);
    }, 5000);

    pendingUpdateRef.current = { ...newPending, timer };
    setPendingUpdateUI(newPending);
  }

  const handleUndo = () => {
      if (!pendingUpdateRef.current) return;

      const current = pendingUpdateRef.current;
      clearTimeout(current.timer);

      console.log('Undoing change...');
      // Revert cache
      queryClient.setQueryData(['people', appId, secret, config], (oldData: any) => {
        if (!oldData) return oldData;
        const newStudents = oldData.students.map((s: Student) => s.id === current.original.id ? current.original : s);
        return { ...oldData, students: newStudents };
      });

      // Revert gamification
      setGamificationState(current.prevGamificationState);
      saveGamificationState(current.prevGamificationState, appId);

      pendingUpdateRef.current = null;
      setPendingUpdateUI(null);
  }

  const handleHistoryUndo = async () => {
      await commandManagerRef.current.undo();
      setCanUndo(commandManagerRef.current.canUndo);
      setCanRedo(commandManagerRef.current.canRedo);
  };

  const handleHistoryRedo = async () => {
      await commandManagerRef.current.redo();
      setCanUndo(commandManagerRef.current.canUndo);
      setCanRedo(commandManagerRef.current.canRedo);
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    await saveConfig(newConfig, appId);
  };

  return (
    <div className="app-container">
       {config.sandboxMode && (
          <div style={{
              backgroundColor: '#ff9800',
              color: 'black',
              padding: '10px',
              textAlign: 'center',
              fontWeight: 'bold',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999
          }}>
              ⚠️ SANDBOX MODE ACTIVE - Changes are simulated
          </div>
      )}
      <div className="header" style={config.sandboxMode ? {marginTop: '40px'} : {}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <h1>Locus</h1>
            {appId && (
                <GamificationWidget
                    streak={gamificationState.currentStreak}
                    dailyFixes={gamificationState.dailyFixes}
                />
            )}
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
            <UndoRedoControls
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleHistoryUndo}
                onRedo={handleHistoryRedo}
            />
            {anomalies.length > 0 && (
                 <button onClick={() => setIsReviewModeOpen(true)} className="settings-btn">
                     🚀 Review Mode ({anomalies.length})
                 </button>
            )}
            <button onClick={() => setIsReportOpen(true)} className="settings-btn">
                 📊 Report
            </button>
            <button onClick={() => setIsGhostModalOpen(true)} className="settings-btn">
                 👻 Ghost Protocol
            </button>
            <button onClick={() => setIsFamilyModalOpen(true)} className="settings-btn">
                 👨‍👩‍👧‍👦 Family Audit
            </button>
            <button onClick={() => setIsConfigOpen(true)} className="settings-btn">
                 ⚙️ Settings
            </button>
        </div>
      </div>

      <div className="auth-section">
        <input
            type="text"
            placeholder="Application ID"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
        />
        <input
            type="password"
            placeholder="Secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
        />
      </div>

      <div className="chart-section">
          {apiStatus === 'checking' && <p>Checking PCO API connection...</p>}
          {apiStatus === 'error' && (
              <div style={{color: 'red', border: '1px solid red', padding: '10px', marginBottom: '10px'}}>
                  {apiError}
              </div>
          )}

          {isLoading && apiStatus === 'ok' && <p>Loading...</p>}
          {error && <p style={{color: 'red'}}>Error fetching data: {error.message}</p>}
          {!isLoading && !error && students.length === 0 && appId && secret && apiStatus === 'ok' && <p>No data found or check credentials.</p>}

          <GradeScatter
            data={students.filter(s => s.pcoGrade !== null)}
            onPointClick={setSelectedStudent}
            colorblindMode={config.colorblindMode}
            muteSounds={config.muteSounds}
          />

          {nextUrl && !isLoading && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button onClick={handleLoadMore} disabled={isLoadingMore} className="settings-btn">
                      {isLoadingMore ? 'Loading...' : 'Load More Records'}
                  </button>
              </div>
          )}
      </div>

      <SmartFixModal
        isOpen={!!selectedStudent}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onSave={handleSaveStudent}
        graderOptions={config.graderOptions}
      />

      <ReviewMode
        isOpen={isReviewModeOpen}
        onClose={() => setIsReviewModeOpen(false)}
        students={anomalies}
        onSave={handleSaveStudent}
        graderOptions={config.graderOptions}
        muteSounds={config.muteSounds}
      />

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        currentConfig={config}
        onSave={handleSaveConfig}
      />

      <GhostModal
        isOpen={isGhostModalOpen}
        onClose={() => setIsGhostModalOpen(false)}
        students={ghosts}
        onArchive={handleArchiveGhosts}
        onAnalyze={handleAnalyzeGhosts}
        isArchiving={isArchiving}
      />

      <FamilyModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
        issues={familyIssues}
      />

      <RobertReport
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        stats={stats}
        history={healthHistory}
        students={students}
        auth={auth}
      />

      {showConfetti && <Confetti />}

      {latestBadge && (
          <BadgeToast
            badge={latestBadge}
            onClose={() => setLatestBadge(null)}
          />
      )}

      {pendingUpdateUI && (
          <UndoToast
            message={`Updated grade for ${pendingUpdateUI.updated.name}`}
            onUndo={handleUndo}
            duration={5000}
          />
      )}
    </div>
  )
}

export default App
