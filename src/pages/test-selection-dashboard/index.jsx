import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { supabase } from "../../supabaseClient";
import TopNav from '../../components/ui/TopNav';
import ProgressSummaryPanel from './components/ProgressSummaryPanel';
import ConfidenceLevelSelector from './components/ConfidenceLevelSelector';
import QuickAccessButtons from './components/QuickAccessButtons';
import TopicFilterBar from './components/TopicFilterBar';
import TestTopicCard from './components/TestTopicCard';
import ConfidenceTipsSection from './components/ConfidenceTipsSection';

const TestSelectionDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [confidenceLevel, setConfidenceLevel] = useState('intermediate');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [testSets, setTestSets] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [userStats, setUserStats] = useState({
    recentScore: 0,
    totalTests: 0,
    averageScore: 0,
    improvementTrend: 0,
    lastTestDate: "N/A",
  });

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        let fetchedTests = [];
        
        // Fetch Test Sets from Supabase
        // Requirement: Fetch all active tests (49 expected)
        const { data: setsData, error: setsError } = await supabase
          .from("test_sets")
          .select("*")
          .eq("is_active", true);

        // If Supabase works and has data, use it.
        if (!setsError && setsData && setsData.length > 0) {
          fetchedTests = setsData;
        } else {
          // Fallback if DB is empty or error (dev environment safety)
          try {
            const response = await fetch("https://l-hit-aged7aquila.onrender.com/api/test-sets");
            const data = await response.json();
            if (data.success && Array.isArray(data.sets)) fetchedTests = data.sets;
          } catch (apiError) {
            console.error("API fallback failed:", apiError);
          }
        }
        
        setTestSets(fetchedTests);
        setFilteredTests(fetchedTests);

        // Fetch User Stats from Supabase
        // Requirement: Fetch all evaluated sessions for the user
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("speaking_sessions")
          .select("*")
          .eq("student_id", user.id)
          .eq("status", "evaluated")
          .order("completed_at", { ascending: false });

        if (!sessionsError && sessionsData) {
          const totalTests = sessionsData.length;
          const totalScore = sessionsData.reduce((sum, s) => sum + (s.ai_band_score || 0), 0);
          const averageScore = totalTests > 0 ? (totalScore / totalTests).toFixed(1) : 0;
          const recentScore = totalTests > 0 ? (sessionsData[0].ai_band_score || 0) : 0;
          const lastTestDate = totalTests > 0 ? new Date(sessionsData[0].completed_at).toLocaleDateString() : 'N/A';

          let improvementTrend = 0;
          if (totalTests >= 2) {
            improvementTrend = (sessionsData[0].ai_band_score || 0) - (sessionsData[1].ai_band_score || 0);
          }
          setUserStats({ totalTests, averageScore, recentScore, lastTestDate, improvementTrend });
        } else {
          console.warn("User stats fetch issue:", sessionsError);
        }
      } catch (error) {
        console.error("Error in dashboard data flow:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    let filtered = [...testSets];

    if (searchQuery?.trim() !== '') {
      filtered = filtered.filter(
        (test) =>
          test?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(
        (test) =>
          test?.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (test) =>
          test?.categories?.name?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredTests(filtered);
  }, [searchQuery, selectedDifficulty, selectedCategory, testSets]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav userRole="student" />
      <main className="container-safe py-6 md:py-8 lg:py-12">
        <div className="space-y-6 md:space-y-8">
          <ProgressSummaryPanel stats={userStats} loading={loading} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <ConfidenceLevelSelector
                selectedLevel={confidenceLevel}
                onLevelChange={setConfidenceLevel}
              />
            </div>
            <div className="lg:col-span-1">
              <QuickAccessButtons />
            </div>
          </div>

          <TopicFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          <div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground">
                Available Tests
              </h2>
              <span className="text-sm md:text-base text-muted-foreground font-caption">
                {filteredTests?.length} {filteredTests?.length === 1 ? 'test' : 'tests'} found
              </span>
            </div>

            {loading ? (
              <div className="text-center py-20 text-muted-foreground col-span-full">Loading tests...</div>
            ) : filteredTests?.length === 0 ? (
              <div className="bg-card rounded-lg p-8 md:p-12 text-center border border-border">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">
                  No tests found
                </h3>
                <p className="text-sm md:text-base text-muted-foreground font-caption">
                  Try adjusting your filters or search query to find more tests
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredTests?.map((test) => (
                  <TestTopicCard key={test?.id} test={test} />
                ))}
              </div>
            )}
          </div>

          <ConfidenceTipsSection />
        </div>
      </main>
    </div>
  );
};

export default TestSelectionDashboard;