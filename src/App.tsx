import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GradeScatter } from './components/GradeScatter'
import { SmartFixModal } from './components/SmartFixModal'
import { ReviewMode } from './components/ReviewMode'
import { ConfigModal } from './components/ConfigModal'
import { GhostModal } from './components/GhostModal'
import { FamilyModal } from './components/FamilyModal'
import { UndoToast } from './components/UndoToast'
import { BurnoutReport } from './components/BurnoutReport'
import { RecruitmentReport } from './components/RecruitmentReport'
import { NewcomerFunnel } from './components/NewcomerFunnel'
import { AttendancePulse } from './components/AttendancePulse'
import { BusFactorGraph } from './components/BusFactorGraph'
import { MissingVolunteersReport } from './components/MissingVolunteersReport'
import { GenerationStack } from './components/GenerationStack'
import { DuplicatesReport } from './components/DuplicatesReport'
import { NewsletterArchitect } from './components/NewsletterArchitect'
import { SmallGroupSorter } from './components/SmallGroupSorter'

import { GamificationWidget } from './components/GamificationWidget'
import { UndoRedoControls } from './components/UndoRedoControls'
import { transformPerson, fetchAllPeople, fetchCheckInCount, checkApiVersion } from './utils/pco'
import { isGhost } from './utils/ghost'
import { analyzeFamilies } from './utils/family'
import { loadConfig, saveConfig, loadHealthHistory, saveHealthSnapshot, loadGamificationState, saveGamificationState } from './utils/storage'
import { recordEdits, editsToday } from './utils/gamification'
import { saveToCache, loadFromCache } from './utils/cache'
import { calculateHealthStats } from './utils/analytics'
import { CommandManager } from './utils/commands'
import { UpdateStudentCommand } from './commands/UpdateStudentCommand'
import { BatchUpdateCommand } from './commands/BatchUpdateCommand'
import { ArchiveCommand } from './commands/ArchiveCommand'
import type { AppConfig, GamificationState } from './utils/storage'
import type { Student, PcoPerson } from './utils/pco'
import type { FamilyIssue } from './utils/family'
import './App.css'

// New Components

import { LandingPage } from './components/LandingPage';
import { CoreLayout } from './layouts/CoreLayout';
import { IntelligenceLayout } from './layouts/IntelligenceLayout';

import { Dashboard } from './components/Dashboard'
import { AutomationsReport } from './components/AutomationsReport'

function App() {
  const [appId, setAppId] = useState('')
  const [secret, setSecret] = useState('')
  const [config, setConfig] = useState<AppConfig>({ graderOptions: {} });


  // Role State
  const [userRole, setUserRole] = useState<'core' | 'intelligence' | null>(null);

  const handleSelectRole = (role: 'core' | 'intelligence') => {
      setUserRole(role);
      setCurrentView(role === 'core' ? 'dashboard' : 'retention');
  };

  const [currentView, setCurrentView] = useState('dashboard');


  // Modals
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isGhostModalOpen, setIsGhostModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isReviewModeOpen, setIsReviewModeOpen] = useState(false);
  const [isReviewModeSpeedRun, setIsReviewModeSpeedRun] = useState(false);

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // State for gamification
  const [gamificationState, setGamificationState] = useState<GamificationState>({ fixHistory: {} });

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
          console.error("API Check Failed", e);
          setApiStatus('error');
          setApiError(e.message || 'Unknown API Error');
        }
      };
      // Debounce slightly to avoid rapid checks while typing
      const timer = setTimeout(check, 1000);
      return () => clearTimeout(timer);
    } else {
        console.log("App: Missing credentials, idle");
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

      const updates = await Promise.all(ghostsToAnalyze.map(async (ghost) => {
          const checkInCount = await fetchCheckInCount(ghost.id, auth);
          return { id: ghost.id, checkInCount };
      }));

      queryClient.setQueryData(['people', appId, secret, config], (oldData: any) => {
          if (!oldData) return oldData;
          const newStudents = oldData.students.map((s: Student) => {
              const update = updates.find(u => u.id === s.id);
              if (update) {
                  return {
                      ...s,
                      checkInCount: update.checkInCount ?? 0
                  };
              }
              return s;
          });
          return { ...oldData, students: newStudents };
      });
  };

  const handleArchiveGhosts = async (ghostsToArchive: Student[]) => {
      if (ghostsToArchive.length === 0) return;
      setIsArchiving(true);
      const auth = btoa(`${appId}:${secret}`);

      // Archival goes through the command stack like every other write, so Undo
      // reaches it. It used to be a bare loop — the one action in the product
      // that could not be taken back, and the one with the widest blast radius.
      const command = new ArchiveCommand(
          ghostsToArchive,
          auth,
          config.sandboxMode || false,
          (student) => {
              queryClient.setQueryData(['people', appId, secret, config], (oldData: any) => {
                  if (!oldData) return oldData;
                  return {
                      ...oldData,
                      students: oldData.students.filter((s: Student) => s.id !== student.id)
                  };
              });
          }
      );

      try {
          await command.execute();
          commandManagerRef.current.execute(command);
          setCanUndo(commandManagerRef.current.canUndo);
          setCanRedo(commandManagerRef.current.canRedo);
          alert(`Archived ${command.archived.length} in Planning Center. Undo is available.`);
      } catch (e) {
          console.error('Ghost archival stopped', e);
          if (command.archived.length > 0) {
              // Some landed. Keep the command so those can be reversed, and do not
              // pretend the batch either fully succeeded or fully failed.
              commandManagerRef.current.execute(command);
              setCanUndo(commandManagerRef.current.canUndo);
              setCanRedo(commandManagerRef.current.canRedo);
              alert(
                  `Archiving stopped after ${command.archived.length} of ${ghostsToArchive.length}. ` +
                  `Those ${command.archived.length} are inactive in Planning Center; the rest were not touched. ` +
                  `Undo will reverse the ones that went through.`
              );
          } else {
              alert(`Nothing was archived. ${e instanceof Error ? e.message : 'Check the console.'}`);
          }
      } finally {
          queryClient.invalidateQueries({ queryKey: ['people', appId, secret, config] });
          setIsArchiving(false);
          setIsGhostModalOpen(false);
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

  const handleFamilySwap = async (issue: FamilyIssue, type: string) => {
      if (type !== 'Swap') return;

      const auth = btoa(`${appId}:${secret}`);

      const child = students.find(s => s.id === issue.studentId);
      const parent = students.find(s => s.id === issue.parentId);

      if (!child || !parent) return;

      // Swap roles
      // Child becomes Parent (child: false)
      // Parent becomes Child (child: true)

      const updates = [
          { original: child, updated: { ...child, isChild: false } },
          { original: parent, updated: { ...parent, isChild: true } }
      ];

      const command = new BatchUpdateCommand(
          updates,
          auth,
          config.sandboxMode || false,
          (updatedStudent) => {
               queryClient.setQueryData(['people', appId, secret, config], (oldData: { students: Student[], nextUrl: string | undefined, raw: PcoPerson[] } | undefined) => {
                  if (!oldData) return oldData;
                  const newStudents = oldData.students.map((s: Student) => s.id === updatedStudent.id ? updatedStudent : s);
                  return { ...oldData, students: newStudents };
              });
          }
      );

      try {
          await command.execute();
          commandManagerRef.current.execute(command);
          setCanUndo(commandManagerRef.current.canUndo);
          setCanRedo(commandManagerRef.current.canRedo);
          // alert('Roles swapped successfully!'); // Don't alert in test?
      } catch (e) {
          console.error('Failed to swap roles', e);
          alert('Failed to swap roles.');
      }
  };

  const handleSaveStudentBulk = async (updates: { original: Student, updated: Student }[]) => {
      const auth = btoa(`${appId}:${secret}`);

      // One edit recorded per record touched. Which field changed no longer
      // matters, because the count no longer claims anything about correctness.
      const currentState = recordEdits(gamificationState, updates.length);

      setGamificationState(currentState);
      saveGamificationState(currentState, appId);

      const onStateChange = (student: Student) => {
          queryClient.setQueryData(['people', appId, secret, config], (oldData: any) => {
             if (!oldData) return oldData;
             const newStudents = oldData.students.map((s: Student) => s.id === student.id ? student : s);
             return { ...oldData, students: newStudents };
         });
      };

      const command = new BatchUpdateCommand(
          updates,
          auth,
          config.sandboxMode || false,
          onStateChange
      );

      try {
          await command.execute();
          commandManagerRef.current.execute(command);
          setCanUndo(commandManagerRef.current.canUndo);
          setCanRedo(commandManagerRef.current.canRedo);
      } catch (error) {
          console.error('Failed to execute bulk update', error);

          // The batch writes one record at a time and PCO has no transaction to
          // roll back, so whatever landed before the failure is live. Only the
          // records that never got written may be reverted on screen — telling
          // the operator "the changes have been reverted" while some of them
          // are sitting in PCO is how a half-finished batch becomes invisible.
          const written = new Set(command.written.map(u => u.original.id));
          for (const update of updates) {
              if (!written.has(update.original.id)) onStateChange(update.original);
          }

          if (written.size > 0) {
              // Keep the command on the stack: those writes are real and Undo is
              // the only way back.
              commandManagerRef.current.execute(command);
              setCanUndo(commandManagerRef.current.canUndo);
              setCanRedo(commandManagerRef.current.canRedo);
              alert(
                  `Bulk update stopped after ${written.size} of ${updates.length} records.\n\n` +
                  `Those ${written.size} were saved to Planning Center and are still there. ` +
                  `The rest were not saved. Use Undo to reverse the ones that went through.`
              );
          } else {
              alert('Bulk update failed. Nothing was saved to Planning Center.');
          }
      }
  };

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
    const newGamificationState = recordEdits(gamificationState);
    setGamificationState(newGamificationState);

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

  const handleNavigation = (view: string) => {
      if (view === 'ghosts') {
          setIsGhostModalOpen(true);
      } else if (view === 'families') {
          setIsFamilyModalOpen(true);
      } else if (view === 'settings') {
          setIsConfigOpen(true);
      } else {
          setCurrentView(view);
      }
  };

  if (!userRole) {
      return <LandingPage onSelectRole={handleSelectRole} />;
  }

  const Layout = userRole === 'core' ? CoreLayout : IntelligenceLayout;

  return (
    <div className="app-container" style={{display: 'flex', width: '100vw', height: '100vh', margin: 0, padding: 0}}>
       {config.sandboxMode && (
          <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3000,
              background: '#7C5A0C', color: '#fff', textAlign: 'center',
              padding: '0.4rem', fontSize: '0.85rem'
          }}>
              Sandbox Mode — writes are intercepted locally and never reach Planning Center.
              If the interceptor is not running, saving will refuse rather than write.
          </div>
      )}

      <Layout currentView={currentView} onChangeView={handleNavigation} anomaliesCount={anomalies.length}>




          {/* Auth Screen (Overlay if not authed) */}
          {!appId || !secret || apiStatus === 'idle' || apiStatus === 'error' ? (
              <div className="auth-overlay" style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: '#1a1a1a',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
              }}>
                  <h1>Locus</h1>
                  <p>Ministry Intelligence Platform</p>
                   <div className="auth-section" style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
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
                  {apiStatus === 'checking' && <p>Connecting...</p>}
                  {apiStatus === 'error' && <p style={{color: 'red'}}>{apiError}</p>}
              </div>
          ) : (
              <>
                  {/* Global Toolbar (Undo/Redo, Gamification) */}
                   <div className="toolbar" style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
                        <UndoRedoControls
                            canUndo={canUndo}
                            canRedo={canRedo}
                            onUndo={handleHistoryUndo}
                            onRedo={handleHistoryRedo}
                        />
                        <GamificationWidget
                            editsToday={editsToday(gamificationState)}
                            flaggedRecords={anomalies.length}
                        />
                   </div>

                  {isLoading && <p>Loading Data...</p>}
                  {error && <p style={{color: 'red'}}>Error: {error.message}</p>}

                  {!isLoading && !error && (
                      <>
                        {currentView === 'dashboard' && (
                            <Dashboard
                                students={students}
                                onNavigate={handleNavigation}
                                auth={auth}
                                gamificationState={gamificationState}
                            />
                        )}

                        {currentView === 'data-health' && (
                            <div className="view-container">
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                                    <h2>Data Health</h2>
                                    {anomalies.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => {
                                                setIsReviewModeSpeedRun(false);
                                                setIsReviewModeOpen(true);
                                            }} className="settings-btn">
                                                🚀 Review Mode ({anomalies.length})
                                            </button>
                                            <button onClick={() => {
                                                setIsReviewModeSpeedRun(true);
                                                setIsReviewModeOpen(true);
                                            }} className="settings-btn" title="Fix as many as you can in 60 seconds!">
                                                ⏱️ Speed Run
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <GradeScatter
                                    data={students.filter(s => s.pcoGrade !== null)}
                                    onPointClick={setSelectedStudent}
                                    colorblindMode={config.colorblindMode}
                                    muteSounds={config.muteSounds}
                                />
                                {nextUrl && (
                                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                        <button onClick={handleLoadMore} disabled={isLoadingMore} className="settings-btn">
                                            {isLoadingMore ? 'Loading...' : 'Load More Records'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentView === 'burnout' && (
                            <div className="view-container">
                                <h2>Burnout Risk Analysis</h2>
                                <BurnoutReport students={students} auth={auth} />
                            </div>
                        )}

                        {currentView === 'missing' && (
                            <div className="view-container">
                                <h2>Missing Volunteers</h2>
                                <MissingVolunteersReport students={students} auth={auth} />
                            </div>
                        )}

                        {currentView === 'recruitment' && (
                            <div className="view-container">
                                <h2>Recruitment Intelligence</h2>
                                <RecruitmentReport students={students} auth={auth} />
                            </div>
                        )}

                        {currentView === 'retention' && (
                             <div className="view-container">
                                <h2>Retention Funnel</h2>
                                <NewcomerFunnel auth={auth} />
                            </div>
                        )}

                        {currentView === 'attendance' && (
                             <div className="view-container">
                                <h2>Attendance Pulse</h2>
                                <AttendancePulse auth={auth} />
                            </div>
                        )}

                        {currentView === 'bus-factor' && (
                             <div className="view-container">
                                <h2>Bus Factor Analysis</h2>
                                <BusFactorGraph students={students} auth={auth} />
                            </div>
                        )}

                        {currentView === 'demographics' && (
                             <div className="view-container">
                                <h2>Demographics</h2>
                                <GenerationStack students={students} />
                            </div>
                        )}

                        {currentView === 'automations' && (
                             <div className="view-container">
                                <AutomationsReport students={students} graderOptions={config.graderOptions} />
                            </div>
                        )}

                        {currentView === 'duplicates' && (
                             <div className="view-container">
                                <h2>Duplicate Detective</h2>
                                <DuplicatesReport students={students} />
                            </div>
                        )}

                        {currentView === 'small-groups' && (
                            <div className="view-container">
                                <SmallGroupSorter students={students} />
                            </div>
                        )}
                        {currentView === 'newsletter' && (
                             <div className="view-container">
                                 <NewsletterArchitect students={students} auth={auth} />
                             </div>
                        )}
                      </>
                  )}
              </>
          )}

            </Layout>

      {/* Modals & Toasts */}
      {userRole === 'core' && (<>
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
        onSaveBulk={handleSaveStudentBulk}
        graderOptions={config.graderOptions}
        muteSounds={config.muteSounds}
        isSpeedRun={isReviewModeSpeedRun}
        zenMode={config.zenMode}
        zenAudioTheme={config.zenAudioTheme}
      />

      </>)}

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
        onFix={handleFamilySwap}
      />

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
