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
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [waitingStudents, setWaitingStudents] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, visible_password, is_blocked");

      if (error) {
        console.error("Error fetching students:", error);
      } else {
        const formattedStudents = data.map(profile => ({
          id: profile.id,
          name: profile.full_name,
          email: profile.email,
          studentId: profile.username,
          visible_password: profile.visible_password,
          is_blocked: profile.is_blocked,
          // Mocking stats to prevent UI breakage
          lastAttempt: "N/A",
          latestScore: 0,
          progressPercentage: 0,
          totalAttempts: 0,
          averageScore: 0,
        }));
        setStudents(formattedStudents);
      }
    };

    fetchStudents();
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobby' },
        (payload) => {
          fetchWaitingStudents();
        }
      )
      .subscribe();


    return () => {
      window.removeEventListener('resize', handleResize);
      supabase.removeChannel(lobbyChannel);
    };
  }, []);

  const mockMetrics = {
    totalStudents: 24,
    averageScore: 6.8,
    totalAttempts: 156,
    improvementRate: 12.5,
  };

  const mockActivities = [
    {
      id: 1,
      type: "new_attempt",
      studentName: "Emily Rodriguez",
      description: "Completed Part 3 - Discussion with score 8.0",
      timestamp: "2 hours ago",
      actionRequired: true,
    },
    {
      id: 2,
      type: "feedback_pending",
      studentName: "Michael Chen",
      description: "Awaiting feedback on recent attempt",
      timestamp: "5 hours ago",
      actionRequired: true,
    },
    {
      id: 3,
      type: "improvement",
      studentName: "Sarah Johnson",
      description: "Improved from 7.0 to 7.5 (+0.5 band score)",
      timestamp: "1 day ago",
      actionRequired: false,
    },
    {
      id: 4,
      type: "new_attempt",
      studentName: "Priya Patel",
      description: "Completed full mock test with score 7.0",
      timestamp: "1 day ago",
      actionRequired: true,
    },
  ];

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
    navigate('/student-audio-review', { state: { studentId } });
  };

  const handleAddFeedback = (studentId) => {
    navigate('/student-audio-review', { state: { studentId, openFeedback: true } });
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
          <PerformanceMetrics metrics={mockMetrics} />
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
            <RecentActivityPanel activities={mockActivities} />
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