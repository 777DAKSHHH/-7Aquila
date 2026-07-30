import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext.jsx";
import { supabase } from "../../supabaseClient";
import TopNav from '../../components/ui/TopNav';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ProgressChart from './components/ProgressChart';
import StatsSummary from './components/StatsSummary';
import FilterControls from './components/FilterControls';
import AttemptCard from './components/AttemptCard';
import AttemptsTable from './components/AttemptsTable';
import ComparisonModal from './components/ComparisonModal';

const PracticeHistory = () => {
  const { user } = useAuth();
  
  const [activeModule, setActiveModule] = useState('speaking'); // 'speaking' | 'writing' | 'reading' | 'listening'
  const [viewMode, setViewMode] = useState('table');
  const [dateRange, setDateRange] = useState('all');
  const [topicType, setTopicType] = useState('all');
  const [scoreRange, setScoreRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttempts, setFilteredAttempts] = useState([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [selectedAttempts, setSelectedAttempts] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async (isBackgroundUpdate = false) => {
      if (!isBackgroundUpdate) setLoading(true);
      try {
        let fetchedData = [];

        if (activeModule === 'speaking') {
          const { data, error } = await supabase
            .from('speaking_sessions')
            .select(`
              *,
              speaking_responses (
                id,
                audio_duration,
                speaking_questions (
                  topic,
                  difficulty
                )
              )
            `)
            .eq('student_id', user?.id)
            .in('status', ['evaluated', 'reviewed'])
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (data) {
            fetchedData = data.map(session => {
              const firstResponse = session.speaking_responses?.[0];
              const question = firstResponse?.speaking_questions;
              const totalSeconds = session.speaking_responses?.reduce((acc, curr) => acc + (curr.audio_duration || 0), 0) || 0;
              const mins = Math.floor(totalSeconds / 60);
              const secs = Math.round(totalSeconds % 60);
              const duration = `${mins}:${secs.toString().padStart(2, '0')}`;

              const isReviewed = session.teacher_band_score !== null && session.teacher_band_score !== undefined;
              const score = (isReviewed ? session.teacher_band_score : session.ai_band_score) || 0;
              
              let ai = session.ai_detailed_feedback;
              if (typeof ai === 'string') {
                try { ai = JSON.parse(ai); } catch (e) {}
              }
              
              const scores = ai?.scores || {};
              const strengths = ai?.strengths?.length > 0 
                ? (Array.isArray(ai.strengths) ? ai.strengths.join(', ') : ai.strengths) 
                : 'View detailed feedback for analysis.';
              const improvements = ai?.improvements?.length > 0 
                ? (Array.isArray(ai.improvements) ? ai.improvements.join(', ') : ai.improvements) 
                : 'View detailed feedback for recommendations.';

              return {
                id: session.id,
                date: new Date(session.created_at).toLocaleDateString(),
                rawDate: new Date(session.created_at),
                topic: question?.topic || 'IELTS Speaking Practice',
                topicType: 'Speaking',
                duration,
                overallScore: score,
                fluency: (isReviewed ? session.teacher_fluency_score : scores.fluency) || score,
                lexical: (isReviewed ? session.teacher_lexical_score : scores.lexical) || score,
                grammar: (isReviewed ? session.teacher_grammar_score : scores.grammar) || score,
                pronunciation: (isReviewed ? session.teacher_pronunciation_score : scores.pronunciation) || score,
                strengths,
                improvements,
                status: session.status,
                difficulty: question?.difficulty || 'Medium',
                reviewed_at: session.reviewed_at,
                teacher_band_score: session.teacher_band_score,
                teacher_fluency_score: session.teacher_fluency_score,
                teacher_lexical_score: session.teacher_lexical_score,
                teacher_grammar_score: session.teacher_grammar_score,
                teacher_pronunciation_score: session.teacher_pronunciation_score,
                teacher_feedback: session.teacher_feedback,
              };
            });
          }
        } else if (activeModule === 'writing') {
          const { data, error } = await supabase
            .from('writing_sessions')
            .select(`
              *,
              writing_task1_questions (title, difficulty),
              writing_task2_questions (title, difficulty)
            `)
            .eq('student_id', user?.id)
            .in('status', ['evaluated', 'reviewed'])
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (data) {
            fetchedData = data.map(session => {
              const isTask2 = !!session.task2_question_id;
              const q = isTask2 ? session.writing_task2_questions : session.writing_task1_questions;
              const mins = Math.floor((session.total_time_seconds || 0) / 60);
              const duration = `${mins} min`;

              return {
                id: session.id,
                date: new Date(session.created_at).toLocaleDateString(),
                rawDate: new Date(session.created_at),
                topic: q?.title || (isTask2 ? 'IELTS Essay Task 2' : 'IELTS Report Task 1'),
                topicType: isTask2 ? 'Task 2 Essay' : 'Task 1 Report',
                duration,
                overallScore: session.overall_band || 0,
                task1Band: session.task1_band,
                task2Band: session.task2_band,
                aiFeedback: session.ai_feedback,
                status: session.status,
                difficulty: q?.difficulty || 'Medium'
              };
            });
          }
        } else if (activeModule === 'reading') {
          const { data, error } = await supabase
            .from('reading_sessions')
            .select(`
              *,
              reading_tests (title, difficulty)
            `)
            .eq('student_id', user?.id)
            .order('started_at', { ascending: false });

          if (error) throw error;

          if (data) {
            fetchedData = data.map(session => {
              const t = session.reading_tests;
              const rawScore = session.raw_score !== null && session.raw_score !== undefined ? `${session.raw_score} / 40` : 'Incomplete';

              return {
                id: session.id,
                date: new Date(session.started_at).toLocaleDateString(),
                rawDate: new Date(session.started_at),
                topic: t?.title || 'IELTS Reading Exam',
                topicType: 'Reading',
                duration: session.completed_at ? 'Completed' : 'Incomplete',
                overallScore: session.band_score || 0,
                correctAnswers: rawScore,
                status: session.completed_at ? 'completed' : 'in_progress',
                difficulty: t?.difficulty || 'Medium'
              };
            });
          }
        } else if (activeModule === 'listening') {
          const { data, error } = await supabase
            .from('listening_sessions')
            .select(`
              *,
              listening_tests (title, difficulty)
            `)
            .eq('student_id', user?.id)
            .order('started_at', { ascending: false });

          if (error) throw error;

          if (data) {
            fetchedData = data.map(session => {
              const t = session.listening_tests;
              const rawScore = session.raw_score !== null && session.raw_score !== undefined ? `${session.raw_score} / 40` : 'Incomplete';

              return {
                id: session.id,
                date: new Date(session.started_at).toLocaleDateString(),
                rawDate: new Date(session.started_at),
                topic: t?.title || 'IELTS Listening Exam',
                topicType: 'Listening',
                duration: session.completed_at ? 'Completed' : 'Incomplete',
                overallScore: session.band_score || 0,
                correctAnswers: rawScore,
                status: session.completed_at ? 'completed' : 'in_progress',
                difficulty: t?.difficulty || 'Medium'
              };
            });
          }
        }

        setAttempts(fetchedData);
        setFilteredAttempts(fetchedData);
      } catch (err) {
        console.error("Error fetching practice history:", err);
      } finally {
        if (!isBackgroundUpdate) setLoading(false);
      }
    };

    fetchHistory();

    // Subscribe to realtime changes (mainly Speaking & Writing)
    let channel;
    if (activeModule === 'speaking' || activeModule === 'writing') {
      channel = supabase
        .channel('practice-history-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: `${activeModule}_sessions`, filter: `student_id=eq.${user?.id}` },
          () => {
            fetchHistory(true);
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, activeModule]);

  // Generate chart data
  const chartData = [...filteredAttempts]
    .sort((a, b) => a.rawDate - b.rawDate)
    .map(a => ({
      date: a.date.split('/').slice(0, 2).join('/'),
      score: a.overallScore,
      fluency: a.fluency || a.overallScore
    }));

  useEffect(() => {
    let filtered = [...attempts];

    if (searchQuery) {
      filtered = filtered?.filter((attempt) =>
        attempt?.topic?.toLowerCase()?.includes(searchQuery?.toLowerCase())
      );
    }

    if (topicType !== 'all') {
      filtered = filtered?.filter(
        (attempt) => attempt?.topicType?.toLowerCase() === topicType?.toLowerCase()
      );
    }

    if (scoreRange !== 'all') {
      const [min, max] = scoreRange?.split('-')?.map(Number);
      filtered = filtered?.filter(
        (attempt) => attempt?.overallScore >= min && attempt?.overallScore < max
      );
    }

    setFilteredAttempts(filtered);
  }, [searchQuery, topicType, scoreRange, dateRange, attempts]);

  const handleReset = () => {
    setDateRange('all');
    setTopicType('all');
    setScoreRange('all');
    setSearchQuery('');
  };

  const handleSort = (field, direction) => {
    const sorted = [...filteredAttempts]?.sort((a, b) => {
      if (direction === 'asc') {
        return a?.[field] > b?.[field] ? 1 : -1;
      }
      return a?.[field] < b?.[field] ? 1 : -1;
    });
    setFilteredAttempts(sorted);
  };

  const handleDownloadReport = () => {
    alert('Downloading progress report...');
  };

  const handleCompareAttempts = () => {
    setSelectedAttempts(filteredAttempts?.slice(0, 2));
    setIsComparisonModalOpen(true);
  };

  const totalAttempts = attempts?.length || 0;
  const averageScore =
    totalAttempts > 0 ? attempts?.reduce((sum, attempt) => sum + attempt?.overallScore, 0) / totalAttempts : 0;
  const firstScore = attempts?.[attempts?.length - 1]?.overallScore || 0;
  const lastScore = attempts?.[0]?.overallScore || 0;
  const improvementPercentage = firstScore > 0 ? (((lastScore - firstScore) / firstScore) * 100)?.toFixed(1) : 0;
  const lastAttemptDate = attempts?.[0]?.date || "N/A";

  // Calculate average criteria scores
  const averageFluency = totalAttempts > 0 ? attempts?.reduce((sum, a) => sum + (a?.fluency || 0), 0) / totalAttempts : 0;
  const averageLexical = totalAttempts > 0 ? attempts?.reduce((sum, a) => sum + (a?.lexical || 0), 0) / totalAttempts : 0;
  const averageGrammar = totalAttempts > 0 ? attempts?.reduce((sum, a) => sum + (a?.grammar || 0), 0) / totalAttempts : 0;
  const averagePronunciation = totalAttempts > 0 ? attempts?.reduce((sum, a) => sum + (a?.pronunciation || 0), 0) / totalAttempts : 0;

  return (
    <div className="min-h-screen bg-background">
      <TopNav userRole="student" />
      <main className="container-safe py-6 md:py-8 lg:py-12">
        
        {/* Module Tab Toggles */}
        <div className="flex border-b border-border mb-6">
          {[
            { id: 'speaking', label: 'Speaking Module', icon: 'Mic' },
            { id: 'writing', label: 'Writing Module', icon: 'Edit3' },
            { id: 'reading', label: 'Reading Module', icon: 'BookOpen' },
            { id: 'listening', label: 'Listening Module', icon: 'Headphones' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeModule === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={tab.icon} size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Practice History
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-caption">
              Track your progress and review past practice test attempts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
            {activeModule === 'speaking' && (
              <Button
                variant="default"
                size="sm"
                iconName="GitCompare"
                iconPosition="left"
                onClick={handleCompareAttempts}
              >
                Compare Attempts
              </Button>
            )}
            <Link to={
              activeModule === 'speaking' ? '/test-selection-dashboard' : `/assessment/${activeModule}`
            }>
              <Button variant="default" size="sm" iconName="Plus" iconPosition="left">
                New Test
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <StatsSummary
            totalAttempts={totalAttempts}
            averageScore={averageScore}
            improvementPercentage={parseFloat(improvementPercentage)}
            lastAttemptDate={lastAttemptDate}
            averageFluency={averageFluency}
            averageLexical={averageLexical}
            averageGrammar={averageGrammar}
            averagePronunciation={averagePronunciation}
            activeModule={activeModule}
          />

          {totalAttempts > 0 && <ProgressChart data={chartData} height={300} />}

          <FilterControls
            dateRange={dateRange}
            topicType={topicType}
            scoreRange={scoreRange}
            searchQuery={searchQuery}
            onDateRangeChange={setDateRange}
            onTopicTypeChange={setTopicType}
            onScoreRangeChange={setScoreRange}
            onSearchChange={setSearchQuery}
            onReset={handleReset}
          />

          <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
                Your Attempts ({filteredAttempts?.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-all duration-base focus-ring ${
                    viewMode === 'table' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  aria-label="Table view"
                >
                  <Icon name="Table" size={18} />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-md transition-all duration-base focus-ring ${
                    viewMode === 'cards' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  aria-label="Card view"
                >
                  <Icon name="LayoutGrid" size={18} />
                </button>
              </div>
            </div>

            {viewMode === 'table' ? (
              <div className="hidden lg:block">
                {loading ? (
                  <div className="p-8 text-center">Loading history...</div>
                ) : (
                  <AttemptsTable attempts={filteredAttempts} activeModule={activeModule} onSort={handleSort} />
                )}
              </div>
            ) : null}

            {viewMode === 'cards' || viewMode === 'table' ? (
              <div className={viewMode === 'table' ? 'lg:hidden' : ''}>
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading history...</div>
                  ) : filteredAttempts?.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-30" />
                      <p className="text-muted-foreground font-caption">
                        No practice attempts found
                      </p>
                    </div>
                  ) : (
                    filteredAttempts?.map((attempt) => (
                      <AttemptCard key={attempt?.id} attempt={attempt} activeModule={activeModule} />
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <ComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        attempts={selectedAttempts}
      />
    </div>
  );
};

export default PracticeHistory;