import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import TopNav from '../../components/ui/TopNav';
import PerformanceMetrics from './components/PerformanceMetrics';
import FilterControls from './components/FilterControls';
import StudentListTable from './components/StudentListTable';
import StudentListCards from './components/StudentListCards';
import RecentActivityPanel from './components/RecentActivityPanel';
import BulkActionsBar from './components/BulkActionsBar';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('speaking'); // speaking, writing, reading, listening
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waitingStudents, setWaitingStudents] = useState([]);
  
  // Student Profile Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalData, setProfileModalData] = useState(null);

  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    averageScore: 0,
    totalAttempts: 0,
    improvementRate: 0,
  });
  const [activities, setActivities] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let sessions = [];
      let sessionsError = null;

      // 1. Query table based on selected module
      if (activeModule === 'speaking') {
        const res = await supabase
          .from("speaking_sessions")
          .select(`
            id, 
            student_id, 
            ai_band_score, 
            ai_detailed_feedback,
            completed_at, 
            status,
            profiles (id, username, full_name, email, visible_password, is_blocked)
          `)
          .in("status", ["evaluated", "reviewed"])
          .order("completed_at", { ascending: false });
        sessions = res.data || [];
        sessionsError = res.error;
      } else if (activeModule === 'writing') {
        const res = await supabase
          .from("writing_sessions")
          .select(`
            id, 
            student_id, 
            overall_band, 
            task1_band,
            task2_band,
            ai_detailed_feedback,
            completed_at, 
            status,
            profiles (id, username, full_name, email, visible_password, is_blocked)
          `)
          .in("status", ["evaluated", "reviewed"])
          .order("completed_at", { ascending: false });
        sessions = res.data || [];
        sessionsError = res.error;
      } else if (activeModule === 'reading') {
        const res = await supabase
          .from("reading_sessions")
          .select(`
            id, 
            student_id, 
            band_score, 
            raw_score,
            completed_at, 
            status,
            profiles (id, username, full_name, email, visible_password, is_blocked)
          `)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false });
        sessions = res.data || [];
        sessionsError = res.error;
      } else if (activeModule === 'listening') {
        const res = await supabase
          .from("listening_sessions")
          .select(`
            id, 
            student_id, 
            band_score, 
            raw_score,
            completed_at, 
            status,
            profiles (id, username, full_name, email, visible_password, is_blocked)
          `)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false });
        sessions = res.data || [];
        sessionsError = res.error;
      }

      if (sessionsError) throw sessionsError;

      const studentMap = {};
      sessions.forEach(s => {
        const sid = s.student_id;
        if (!sid) return;

        const score = activeModule === 'speaking' ? (s.ai_band_score || 0) : (s.overall_band || s.band_score || 0);

        if (!studentMap[sid]) {
          let subscores = {};
          if (activeModule === 'speaking') {
            let ai = s.ai_detailed_feedback;
            if (typeof ai === 'string') {
              try { ai = JSON.parse(ai); } catch (e) {}
            }
            subscores = ai?.scores || {};
          }

          studentMap[sid] = {
            id: sid,
            name: s.profiles?.full_name || "Unknown",
            email: s.profiles?.email || "No email",
            studentId: s.profiles?.username || sid.substring(0,8),
            visible_password: s.profiles?.visible_password,
            is_blocked: s.profiles?.is_blocked,
            lastAttempt: new Date(s.completed_at || s.created_at).toLocaleDateString(),
            latestScore: score,
            
            // Speaking Subscores
            fluency: subscores.fluency || score || 0,
            lexical: subscores.lexical || score || 0,
            grammar: subscores.grammar || score || 0,
            pronunciation: subscores.pronunciation || score || 0,

            // Writing Subscores
            task1Band: s.task1_band || 0,
            task2Band: s.task2_band || 0,

            // Reading/Listening Subscores
            raw_score: s.raw_score !== null && s.raw_score !== undefined ? `${s.raw_score} / 40` : "Incomplete",

            progressPercentage: 0,
            totalAttempts: 0,
            averageScore: 0,
            latestSessionId: s.id,
            sumScores: 0,
            firstScore: score
          };
        }
        studentMap[sid].totalAttempts += 1;
        studentMap[sid].sumScores += score;
        studentMap[sid].firstScore = score;
      });

      const formattedStudents = Object.values(studentMap).map(st => {
        let progressPercentage = 0;
        if (st.totalAttempts >= 2) {
          progressPercentage = st.latestScore > st.firstScore ? ((st.latestScore - st.firstScore) / 9) * 100 : 0; 
        } else if (st.totalAttempts === 1) {
          progressPercentage = (st.latestScore / 9) * 100;
        }
        return {
          ...st,
          averageScore: parseFloat((st.sumScores / st.totalAttempts).toFixed(1)),
          progressPercentage: Math.min(100, Math.round(progressPercentage))
        };
      });

      setStudents(formattedStudents);

      if (sessions && sessions.length > 0) {
        const totalStudents = formattedStudents.length;
        const totalAttempts = sessions.length;
        const totalScoreSum = sessions.reduce((sum, s) => {
          const sc = activeModule === 'speaking' ? (s.ai_band_score || 0) : (s.overall_band || s.band_score || 0);
          return sum + sc;
        }, 0);
        const overallAverage = totalAttempts > 0 ? (totalScoreSum / totalAttempts).toFixed(1) : 0;

        let improvedCount = 0;
        let totalCountWithMultiple = 0;
        formattedStudents.forEach(st => {
          const studentSessions = sessions.filter(s => s.student_id === st.id);
          if (studentSessions.length >= 2) {
            totalCountWithMultiple++;
            const latest = activeModule === 'speaking' ? (studentSessions[0].ai_band_score || 0) : (studentSessions[0].overall_band || studentSessions[0].band_score || 0);
            const first = activeModule === 'speaking' ? (studentSessions[studentSessions.length - 1].ai_band_score || 0) : (studentSessions[studentSessions.length - 1].overall_band || studentSessions[studentSessions.length - 1].band_score || 0);
            if (latest > first) {
              improvedCount++;
            }
          }
        });
        const improvementRate = totalCountWithMultiple > 0 ? ((improvedCount / totalCountWithMultiple) * 100).toFixed(1) : 0;

        setMetrics({
          totalStudents,
          averageScore: parseFloat(overallAverage),
          totalAttempts,
          improvementRate: parseFloat(improvementRate),
        });
      } else {
        setMetrics({
          totalStudents: formattedStudents.length,
          averageScore: 0,
          totalAttempts: 0,
          improvementRate: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // 1. Fetch sessions in parallel (without nested profiles join to avoid relationship errors)
      const [speakingRes, writingRes, readingRes, listeningRes] = await Promise.all([
        supabase.from("speaking_sessions").select("id, completed_at, status, student_id").order("completed_at", { ascending: false }).limit(40),
        supabase.from("writing_sessions").select("id, completed_at, status, student_id").order("completed_at", { ascending: false }).limit(40),
        supabase.from("reading_sessions").select("id, completed_at, status, student_id").order("completed_at", { ascending: false }).limit(40),
        supabase.from("listening_sessions").select("id, completed_at, status, student_id").order("completed_at", { ascending: false }).limit(40)
      ]);

      const rawActs = [];
      const studentIds = new Set();

      const collectSessions = (resData, moduleName, description, typeGetter) => {
        if (!resData) return;
        resData.forEach(s => {
          if (!s.completed_at) return;
          studentIds.add(s.student_id);
          rawActs.push({
            id: s.id,
            studentId: s.student_id,
            completedAt: s.completed_at,
            status: s.status,
            description,
            module: moduleName,
            type: typeGetter(s)
          });
        });
      };

      collectSessions(speakingRes.data, "speaking", "took the Speaking CBT module test", s => s.status === "completed" ? "feedback_pending" : "new_attempt");
      collectSessions(writingRes.data, "writing", "took the Writing CBT module test", s => s.status === "submitted" ? "feedback_pending" : "new_attempt");
      collectSessions(readingRes.data, "reading", "took the Reading CBT module test", s => "new_attempt");
      collectSessions(listeningRes.data, "listening", "took the Listening CBT module test", s => "new_attempt");

      // 2. Fetch profiles for all unique studentIds in a single query
      const profileMap = {};
      if (studentIds.size > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", Array.from(studentIds));

        if (!pErr && profiles) {
          profiles.forEach(p => {
            profileMap[p.id] = p.full_name;
          });
        }
      }

      // 3. Map studentName and sort by timestamp
      const allActs = rawActs.map(act => ({
        id: act.id,
        studentName: profileMap[act.studentId] || "Unknown Student",
        description: act.description,
        timestamp: new Date(act.completedAt),
        type: act.type,
        actionRequired: true,
        module: act.module
      }));

      const sortedActs = allActs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50)
        .map(a => ({
          ...a,
          timestamp: a.timestamp.toLocaleString()
        }));

      setActivities(sortedActs);
    } catch (err) {
      console.error("Fallback activities failed:", err);
    }
  };

  const handleOpenStudentProfile = async (studentId) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const [speaking, writing, reading, listening] = await Promise.all([
        supabase.from("speaking_sessions").select("ai_band_score, completed_at").eq("student_id", studentId).in("status", ["evaluated", "reviewed"]).order("completed_at", { ascending: false }),
        supabase.from("writing_sessions").select("overall_band, completed_at").eq("student_id", studentId).in("status", ["evaluated", "reviewed"]).order("completed_at", { ascending: false }),
        supabase.from("reading_sessions").select("band_score, completed_at").eq("student_id", studentId).not("completed_at", "is", null).order("completed_at", { ascending: false }),
        supabase.from("listening_sessions").select("band_score, completed_at").eq("student_id", studentId).not("completed_at", "is", null).order("completed_at", { ascending: false })
      ]);

      const calculateStats = (data, scoreField) => {
        if (!data || data.length === 0) return { avg: 0, count: 0, last: "N/A" };
        const sum = data.reduce((acc, row) => acc + (row[scoreField] || 0), 0);
        return {
          avg: parseFloat((sum / data.length).toFixed(1)),
          count: data.length,
          last: new Date(data[0].completed_at).toLocaleDateString()
        };
      };

      setProfileModalData({
        student,
        speaking: calculateStats(speaking.data, "ai_band_score"),
        writing: calculateStats(writing.data, "overall_band"),
        reading: calculateStats(reading.data, "band_score"),
        listening: calculateStats(listening.data, "band_score")
      });
      setShowProfileModal(true);
    } catch (err) {
      console.error("Error compiling student stats:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeModule]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    fetchRecentActivities();
    handleResize();
    window.addEventListener('resize', handleResize);

    const fetchWaitingStudents = async () => {
      const { data, error } = await supabase
        .from("lobby")
        .select("*")
        .eq("status", "waiting");

      if (error) {
        console.error("Error fetching waiting students:", error);
      } else {
        setWaitingStudents(data || []);
      }
    };

    fetchWaitingStudents();

    const lobbyChannel = supabase
      .channel('lobby-faculty-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobby' }, () => {
        fetchWaitingStudents();
      })
      .subscribe();

    const sessionsChannel = supabase
      .channel('faculty-sessions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'speaking_sessions' }, () => {
        fetchDashboardData();
        fetchRecentActivities();
      })
      .subscribe();

    return () => {
      window.removeEventListener('resize', handleResize);
      supabase.removeChannel(lobbyChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, []);

  const filteredStudents = students?.filter((student) => {
    const matchesSearch =
      student?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      student?.email?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      student?.studentId?.toLowerCase()?.includes(searchQuery?.toLowerCase());

    const matchesScore =
      scoreFilter === 'all' ||
      (scoreFilter === '7-9' && student?.latestScore >= 7.0) ||
      (scoreFilter === '6-7' && student?.latestScore >= 6.0 && student?.latestScore < 7.0) ||
      (scoreFilter === '0-6' && student?.latestScore < 6.0);

    const matchesProgress =
      progressFilter === 'all' ||
      (progressFilter === 'high' && student?.progressPercentage >= 75) ||
      (progressFilter === 'medium' && student?.progressPercentage >= 50 && student?.progressPercentage < 75) ||
      (progressFilter === 'low' && student?.progressPercentage < 50);

    return matchesSearch && matchesScore && matchesProgress;
  });

  const handleViewAttempts = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student && student.latestSessionId) {
      if (activeModule === 'speaking') {
        navigate(`/student-audio-review/${student.latestSessionId}`);
      } else if (activeModule === 'writing') {
        navigate(`/student-writing-review/${student.latestSessionId}`);
      } else if (activeModule === 'reading') {
        navigate(`/assessment/reading/results/${student.latestSessionId}`);
      } else if (activeModule === 'listening') {
        navigate(`/assessment/listening/results/${student.latestSessionId}`);
      }
    } else {
      alert("No complete sessions found for this student.");
    }
  };

  const handleReviewActivity = (sessionId, moduleType) => {
    const mod = moduleType || activeModule;
    if (mod === 'speaking') {
      navigate(`/student-audio-review/${sessionId}`);
    } else if (mod === 'writing') {
      navigate(`/student-writing-review/${sessionId}`);
    } else if (mod === 'reading') {
      navigate(`/assessment/reading/results/${sessionId}`);
    } else if (mod === 'listening') {
      navigate(`/assessment/listening/results/${sessionId}`);
    }
  };

  const handleAddFeedback = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student && student.latestSessionId) {
      if (activeModule === 'speaking') {
        navigate(`/student-audio-review/${student.latestSessionId}`, { state: { openFeedback: true } });
      } else if (activeModule === 'writing') {
        navigate(`/student-writing-review/${student.latestSessionId}`, { state: { openFeedback: true } });
      } else {
        alert("Teacher overrides are only available for Speaking and Writing modules.");
      }
    } else {
      alert("No complete sessions found for this student.");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setScoreFilter('all');
    setDateFilter('all');
    setProgressFilter('all');
  };

  const handleDownloadReports = () => {
    console.log('Downloading reports for selected students:', selectedStudents);
  };

  const handleExportData = () => {
    console.log('Exporting data for selected students:', selectedStudents);
  };

  const handleClearSelection = () => {
    setSelectedStudents([]);
  };

  const handleApprove = async (lobbyId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Faculty user not found, cannot approve.");
      return;
    }
    await supabase
      .from("lobby")
      .update({ status: "approved", approved_by: user.id })
      .eq("id", lobbyId);
  };

  const handleReject = async (lobbyId) => {
    await supabase
      .from("lobby")
      .update({ status: "rejected" })
      .eq("id", lobbyId);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav userRole="faculty" />
      <main className="container-safe py-6 md:py-8">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Faculty Dashboard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-caption">
              Monitor student progress, override grades, and provide feedback across all CBT modules
            </p>
          </div>
          <Button
            variant="default"
            size="lg"
            iconName="Download"
            iconPosition="left"
            onClick={() => console.log('Download class report')}
          >
            Class Report
          </Button>
        </div>

        {/* Module Switching Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 p-1.5 rounded-xl border border-border/60 max-w-lg mb-6 text-sm font-caption">
          {['speaking', 'writing', 'reading', 'listening'].map((mod) => (
            <button
              key={mod}
              onClick={() => {
                setActiveModule(mod);
                handleResetFilters();
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold uppercase tracking-wider text-xs transition-all duration-300 ${
                activeModule === mod
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>

        {/* Performance Metrics Summary */}
        <div className="mb-6 md:mb-8">
          <PerformanceMetrics metrics={metrics} />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            scoreFilter={scoreFilter}
            onScoreFilterChange={setScoreFilter}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            progressFilter={progressFilter}
            onProgressFilterChange={setProgressFilter}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Student List & Waiting Room / Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-4 md:p-6 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-semibold text-foreground capitalize">
                  {activeModule} Attempts
                </h2>
                <div className="flex items-center gap-2">
                  <Icon name="Users" size={20} className="text-primary" />
                  <span className="text-sm font-semibold font-mono text-foreground">
                    {filteredStudents?.length} students
                  </span>
                </div>
              </div>

              {filteredStudents?.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Search" size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground font-caption">
                    No student attempts found matching your filters
                  </p>
                  <Button variant="ghost" size="sm" onClick={handleResetFilters} className="mt-4">
                    Reset Filters
                  </Button>
                </div>
              ) : isMobileView ? (
                <StudentListCards
                  students={filteredStudents}
                  onViewAttempts={handleViewAttempts}
                  onAddFeedback={handleAddFeedback}
                  activeModule={activeModule}
                  onViewProfile={handleOpenStudentProfile}
                />
              ) : (
                <StudentListTable
                  students={filteredStudents}
                  onViewAttempts={handleViewAttempts}
                  onAddFeedback={handleAddFeedback}
                  activeModule={activeModule}
                  onViewProfile={handleOpenStudentProfile}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-sm">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
                Speaking Lobby
              </h3>
              {waitingStudents.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {waitingStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/30">
                      <div>
                        <span className="font-semibold text-foreground text-xs">{student.username}</span>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Wait: {new Date(student.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(student.id)}
                          disabled={student.status === "approved"}
                          className="h-7 text-[10px] font-bold px-2.5"
                        >
                          {student.status === "approved" ? "Allowed" : "Allow"}
                        </Button>
                        <Button variant="error" size="sm" onClick={() => handleReject(student.id)} className="h-7 text-[10px] font-bold px-2.5">
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground font-caption text-center py-4 text-xs">Lobby is currently empty.</p>
              )}
            </div>
            
            <RecentActivityPanel
              activities={activities}
              onReviewActivity={(sid, mod) => handleReviewActivity(sid, mod)}
            />
          </div>
        </div>
      </main>

      <BulkActionsBar
        selectedCount={selectedStudents?.length}
        onDownloadReports={handleDownloadReports}
        onExportData={handleExportData}
        onClearSelection={handleClearSelection}
      />

      {/* STUDENT PROFILE ANALYTICS MODAL */}
      {showProfileModal && profileModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg transition-colors"
            >
              <Icon name="X" size={18} />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="User" size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-foreground">{profileModalData.student.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {profileModalData.student.studentId} • {profileModalData.student.email}
                  </p>
                </div>
              </div>
            </div>



            {/* Dynamic Multi-Module Analytics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Speaking card */}
              <div className="bg-muted/40 border border-border/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Icon name="Mic" size={16} className="text-primary" />
                  <span className="font-bold text-foreground text-xs uppercase tracking-wide">Speaking Module</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">AVG BAND</span>
                    <span className="font-mono font-extrabold text-foreground text-sm">
                      {profileModalData.speaking.avg > 0 ? profileModalData.speaking.avg : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">ATTEMPTS</span>
                    <span className="font-mono font-extrabold text-foreground text-sm">{profileModalData.speaking.count}</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-[10px] text-muted-foreground block font-bold text-center">LAST TEST</span>
                    <span className="font-mono text-muted-foreground text-[10px] block text-center mt-1">{profileModalData.speaking.last}</span>
                  </div>
                </div>
              </div>

              {/* Writing Card */}
              <div className="bg-muted/40 border border-border/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Icon name="PenTool" size={16} className="text-primary" />
                  <span className="font-bold text-foreground text-xs uppercase tracking-wide">Writing Module</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">AVG BAND</span>
                    <span className="font-mono font-extrabold text-foreground text-sm">
                      {profileModalData.writing.avg > 0 ? profileModalData.writing.avg : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">ATTEMPTS</span>
                    <span className="font-mono font-extrabold text-foreground text-sm">{profileModalData.writing.count}</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-[10px] text-muted-foreground block font-bold text-center">LAST TEST</span>
                    <span className="font-mono text-muted-foreground text-[10px] block text-center mt-1">{profileModalData.writing.last}</span>
                  </div>
                </div>
              </div>

              {/* Reading Card */}
              <div className="bg-muted/40 border border-border/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Icon name="BookOpen" size={16} className="text-primary" />
                  <span className="font-bold text-foreground text-xs uppercase tracking-wide">Reading Module</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">AVG BAND</span>
                    <span className="font-mono font-extrabold text-foreground text-sm">
                      {profileModalData.reading.avg > 0 ? profileModalData.reading.avg : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">ATTEMPTS</span>
                    <span className="font-mono font-extrabold text-foreground text-sm">{profileModalData.reading.count}</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-[10px] text-muted-foreground block font-bold text-center">LAST TEST</span>
                    <span className="font-mono text-muted-foreground text-[10px] block text-center mt-1">{profileModalData.reading.last}</span>
                  </div>
                </div>
              </div>

              {/* Listening Card */}
              <div className="bg-muted/40 border border-border/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Icon name="Headphones" size={16} className="text-primary" />
                  <span className="font-bold text-foreground text-xs uppercase tracking-wide">Listening Module</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">AVG BAND</span>
                    <span className="font-mono font-extrabold text-foreground text-sm">
                      {profileModalData.listening.avg > 0 ? profileModalData.listening.avg : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">ATTEMPTS</span>
                    <span className="font-mono font-extrabold text-foreground text-sm">{profileModalData.listening.count}</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-[10px] text-muted-foreground block font-bold text-center">LAST TEST</span>
                    <span className="font-mono text-muted-foreground text-[10px] block text-center mt-1">{profileModalData.listening.last}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowProfileModal(false)} variant="outline" className="font-bold px-6">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;