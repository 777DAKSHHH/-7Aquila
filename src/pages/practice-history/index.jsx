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
        // Fetch sessions with responses to try and get the topic info
        const { data, error } = await supabase
          .from('speaking_sessions')
          .select(`
            *,
            speaking_responses (
              id,
              audio_duration,
              speaking_questions (
                topic,
                topic_type:topic
              )
            )
          `)
          .eq('student_id', user.id)
          .eq('status', 'evaluated')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedAttempts = data.map(session => {
            // Try to extract topic from the first response's question
            const firstResponse = session.speaking_responses?.[0];
            const question = firstResponse?.speaking_questions;
            
            // Calculate total duration from all responses
            const totalSeconds = session.speaking_responses?.reduce((acc, curr) => acc + (curr.audio_duration || 0), 0) || 0;
            const mins = Math.floor(totalSeconds / 60);
            const secs = Math.round(totalSeconds % 60);
            const duration = `${mins}:${secs.toString().padStart(2, '0')}`;

            // For sub-scores, if not stored separately, we fallback to overall score or estimate
            // In a real app, you might parse `ai_feedback` if it's JSON
            const score = session.ai_band_score || 0;

            return {
              id: session.id,
              date: new Date(session.created_at).toLocaleDateString(),
              rawDate: new Date(session.created_at), // For sorting
              topic: question?.topic || 'IELTS Speaking Practice',
              topicType: question?.topic_type || 'General',
              duration: duration,
              overallScore: score,
              // Fallback subscores to overall if not available individually
              fluency: score,
              lexical: score,
              grammar: score,
              pronunciation: score,
              strengths: 'View detailed feedback for analysis.',
              improvements: 'View detailed feedback for recommendations.'
            };
          });
          setAttempts(formattedAttempts);
          setFilteredAttempts(formattedAttempts);
        }
      } catch (err) {
        console.error("Error fetching practice history:", err);
      } finally {
        if (!isBackgroundUpdate) setLoading(false);
      }
    };

    fetchHistory();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('practice-history-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speaking_sessions', filter: `student_id=eq.${user.id}` },
        (payload) => {
          fetchHistory(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Generate chart data from attempts (reversed for chronological order)
  const chartData = [...filteredAttempts]
    .sort((a, b) => a.rawDate - b.rawDate)
    .map(a => ({
      date: a.date.split('/').slice(0, 2).join('/'), // MM/DD format
      score: a.overallScore,
      fluency: a.fluency
    }))
    .slice(-10); // Show last 10 attempts max

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

  return (
    <div className="min-h-screen bg-background">
      <TopNav userRole="student" />
      <main className="container-safe py-6 md:py-8 lg:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Practice History
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-caption">
              Track your progress and review past speaking test attempts
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
            <Button
              variant="default"
              size="sm"
              iconName="GitCompare"
              iconPosition="left"
              onClick={handleCompareAttempts}
            >
              Compare Attempts
            </Button>
            <Link to="/test-selection-dashboard">
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
          />

          <ProgressChart data={chartData} height={300} />

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
                {loading ? <div className="p-8 text-center">Loading history...</div> : <AttemptsTable attempts={filteredAttempts} onSort={handleSort} />}
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
                      <AttemptCard key={attempt?.id} attempt={attempt} />
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