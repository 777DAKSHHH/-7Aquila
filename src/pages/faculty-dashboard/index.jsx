import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import TopNav from '../../components/ui/TopNav';
import PerformanceMetrics from './components/PerformanceMetrics'; // prettier-ignore
import FilterControls from './components/FilterControls';
import StudentListTable from './components/StudentListTable';
import StudentListCards from './components/StudentListCards';
import RecentActivityPanel from './components/RecentActivityPanel';
import BulkActionsBar from './components/BulkActionsBar';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const FacultyDashboard = () => { // prettier-ignore
  const navigate = useNavigate();
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waitingStudents, setWaitingStudents] = useState([]);
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
      const { data: sessions, error: sessionsError } = await supabase
        .from("speaking_sessions")
        .select(`
          id, 
          student_id, 
          ai_band_score, 
          ai_detailed_feedback,
          completed_at, 
          status,
          profiles (
            id,
            username,
            full_name,
            email,
            visible_password,
            is_blocked
          )
        `)
        .eq("status", "evaluated")
        .order("completed_at", { ascending: false });

      if (sessionsError) {
        throw sessionsError;
      }

      const studentMap = {};
      (sessions || []).forEach(s => {
        const sid = s.student_id;
        if (!sid) return;

        if (!studentMap[sid]) {
          let ai = s.ai_detailed_feedback;
          if (typeof ai === 'string') {
            try { ai = JSON.parse(ai); } catch (e) {}
          }
          const scores = ai?.scores || {};

          studentMap[sid] = {
            id: sid,
            name: s.profiles?.full_name || "Unknown",
            email: s.profiles?.email || "No email",
            studentId: s.profiles?.username || sid.substring(0,8),
            visible_password: s.profiles?.visible_password,
            is_blocked: s.profiles?.is_blocked,
            lastAttempt: new Date(s.completed_at).toLocaleDateString(),
            latestScore: s.ai_band_score || 0,
            fluency: scores.fluency || s.ai_band_score || 0,
            lexical: scores.lexical || s.ai_band_score || 0,
            grammar: scores.grammar || s.ai_band_score || 0,
            pronunciation: scores.pronunciation || s.ai_band_score || 0,
            progressPercentage: 0,
            totalAttempts: 0,
            averageScore: 0,
            latestSessionId: s.id,
            sumScores: 0,
            firstScore: s.ai_band_score || 0
          };
        }
        studentMap[sid].totalAttempts += 1;
        studentMap[sid].sumScores += (s.ai_band_score || 0);
        studentMap[sid].firstScore = s.ai_band_score || 0;
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
        const overallAverage = totalAttempts > 0 
          ? (sessions.reduce((sum, s) => sum + (s.ai_band_score || 0), 0) / totalAttempts).toFixed(1) 
          : 0;

        let improvedCount = 0;
        let totalCountWithMultiple = 0;
        formattedStudents.forEach(st => {
            const studentSessions = sessions.filter(s => s.student_id === st.id);
            if (studentSessions.length >= 2) {
                totalCountWithMultiple++;
                if ((studentSessions[0].ai_band_score || 0) > (studentSessions[studentSessions.length - 1].ai_band_score || 0)) {
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
        setActivities([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await api.get('/speaking/activities/recent');
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch recent activities:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    fetchDashboardData();
    fetchRecentActivities();
    handleResize();
    window.addEventListener('resize', handleResize);

    const fetchWaitingStudents = async () => {
      // This function is defined inside useEffect because it only pertains to the realtime subscription
      // and is not needed elsewhere.
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobby' },
        (payload) => {
          fetchWaitingStudents();
        }
      )
      .subscribe();

    const sessionsChannel = supabase
      .channel('faculty-sessions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'speaking_sessions'
        },
        () => {
          fetchDashboardData();
          fetchRecentActivities();
        }
      )
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
      navigate(`/student-audio-review/${student.latestSessionId}`);
    } else {
      alert("No complete sessions found for this student.");
    }
  };

  const handleReviewActivity = (sessionId) => {
    navigate(`/student-audio-review/${sessionId}`);
  };

  const handleAddFeedback = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student && student.latestSessionId) {
      navigate(`/student-audio-review/${student.latestSessionId}`, { state: { openFeedback: true } });
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Faculty Dashboard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-caption">
              Monitor student progress and provide feedback across all IELTS Speaking practice sessions
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

        <div className="mb-6 md:mb-8">
          <PerformanceMetrics metrics={metrics} />
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  Student List
                </h2>
                <div className="flex items-center gap-2">
                  <Icon name="Users" size={20} color="var(--color-primary)" />
                  <span className="text-sm font-medium mono text-foreground">
                    {filteredStudents?.length} students
                  </span>
                </div>
              </div>

              {filteredStudents?.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Search" size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground font-caption">
                    No students found matching your filters
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
                />
              ) : (
                <StudentListTable
                  students={filteredStudents}
                  onViewAttempts={handleViewAttempts}
                  onAddFeedback={handleAddFeedback}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-6">
              <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                Waiting Room
              </h3>
              {waitingStudents.length > 0 ? (
                <div className="space-y-3">
                  {waitingStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <div>
                        <span className="font-medium text-foreground">{student.username}</span>
                        <p className="text-xs text-muted-foreground font-caption">
                          Entered: {new Date(student.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(student.id)}
                          disabled={student.status === "approved"}
                        >
                          {student.status === "approved" ? "Allowed" : "Allow"}
                        </Button>
                        <Button variant="error" size="sm" onClick={() => handleReject(student.id)}>Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground font-caption text-center py-4">No students are waiting.</p>
              )}
            </div>
            <RecentActivityPanel
              activities={activities}
              onReviewActivity={handleReviewActivity}
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
    </div>
  );
};

export default FacultyDashboard;