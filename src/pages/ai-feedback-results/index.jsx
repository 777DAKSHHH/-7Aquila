import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '../../supabaseClient';
import TopNav from '../../components/ui/TopNav';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import BandScoreCard from './components/BandScoreCard';
import TranscriptViewer from './components/TranscriptViewer';
import FeedbackPanel from './components/FeedbackPanel';
import VocabularyEnhancement from './components/VocabularyEnhancement';

const parseAIFeedback = (feedbackText) => {
  if (!feedbackText) {
    return { criteriaScores: {}, feedback: {}, strengths: [], improvements: [] };
  }

  const getSectionContent = (startMarker, endMarker) => {
    const startIndex = feedbackText.toLowerCase().indexOf(startMarker.toLowerCase());
    if (startIndex === -1) return '';
    const endIndex = endMarker ? feedbackText.toLowerCase().indexOf(endMarker.toLowerCase(), startIndex) : -1;
    const content = feedbackText.substring(
      startIndex + startMarker.length,
      endIndex !== -1 ? endIndex : undefined
    );
    return content.trim();
  };

  const getScore = (content) => {
    const match = content.match(/Band Score:\s*(\d+(\.\d+)?)/i);
    return match ? parseFloat(match[1]) : 0;
  };

  const getExplanation = (content) => {
    const match = content.match(/Band Score:\s*\d+(\.\d+)?\s*([\s\S]*)/i);
    return match ? match[2].trim() : content;
  };

  const fluencyContent = getSectionContent('Fluency and Coherence', 'Lexical Resource');
  const lexicalContent = getSectionContent('Lexical Resource', 'Grammatical Range and Accuracy');
  const grammarContent = getSectionContent('Grammatical Range and Accuracy', 'Pronunciation');
  const pronunciationContent = getSectionContent('Pronunciation', 'Overall Band Score');
  const improvementsContent = getSectionContent('suggestions for improvement', '---end-of-text---');

  const improvements = improvementsContent
    .split('\n')
    .map(line => line.replace(/^-/, '').trim())
    .filter(line => line.length > 0 && !line.toLowerCase().includes('overall band score'));

  return {
    criteriaScores: {
      fluency: getScore(fluencyContent),
      lexical: getScore(lexicalContent),
      grammar: getScore(grammarContent),
      pronunciation: getScore(pronunciationContent),
    },
    feedback: {
      fluency: getExplanation(fluencyContent),
      lexical: getExplanation(lexicalContent),
      grammar: getExplanation(grammarContent),
      pronunciation: getExplanation(pronunciationContent),
    },
    strengths: [], // The current AI prompt does not request strengths.
    improvements: improvements,
  };
};

const AIFeedbackResults = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [results, setResults] = useState(null);
  const [parsedFeedback, setParsedFeedback] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!attemptId) {
      setIsLoading(false);
      setError("No session ID found in URL.");
      return;
    }

    const fetchResults = async () => {
      try {
        setIsLoading(true);

        let session = null;
        let attempts = 0;

        // Retry up to 5 times (important for production)
        while (!session && attempts < 5) {
          const { data, error } = await supabase
            .from('speaking_sessions')
            .select('*')
            .eq('id', attemptId)
            .maybeSingle();

          if (error) throw error;

          session = data;

          if (!session) {
            await new Promise(res => setTimeout(res, 1500));
          }

          attempts++;
        }

        if (!session) {
          throw new Error(`No session found for attempt ID: ${attemptId}`);
        }

        if (session.status !== "evaluated") {
          await new Promise(res => setTimeout(res, 2000));
        }

        const { data: responses, error: responsesError } = await supabase
          .from('speaking_responses')
          .select('*, speaking_questions(*)')
          .eq('session_id', attemptId)
          .order('created_at', { ascending: true });

        if (responsesError) throw responsesError;

        const responsesWithUrl = responses.map(response => {
          const { data } = supabase.storage
            .from('speaking-audio')
            .getPublicUrl(response.audio_path);

          return { ...response, audioUrl: data.publicUrl };
        });

        setResults({ session, responses: responsesWithUrl });
        setParsedFeedback(parseAIFeedback(session.ai_feedback));

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [attemptId]);

  const handleSaveResults = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    alert('Results saved successfully!');
  };

  const handleRetakeTest = () => {
    navigate('/test-selection-dashboard');
  };

  const handleViewHistory = () => {
    navigate('/practice-history');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader" className="animate-spin text-primary mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-foreground">Generating Your Feedback...</h2>
          <p className="text-muted-foreground">This may take a moment. Please wait.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center bg-card p-8 rounded-lg shadow-md border border-error/50">
          <Icon name="AlertTriangle" className="text-error mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-error-foreground">Error Fetching Results</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/test-selection-dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>AI Feedback Results - IELTS Speaking Practice</title>
        <meta name="description" content="View your detailed IELTS Speaking test results with AI-generated band scores, feedback, and improvement recommendations" />
      </Helmet>
      <TopNav userRole="student" />
      <main className="min-h-screen bg-background">
        <div className="container-safe py-6 md:py-8 lg:py-12">
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                  Your Test Results
                </h1>
                <p className="text-sm md:text-base text-muted-foreground font-caption">
                  Comprehensive AI-powered analysis of your speaking performance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Download"
                  iconPosition="left"
                  onClick={() => window.print()}
                >
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Share2"
                  iconPosition="left"
                >
                  Share
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <BandScoreCard
              overallScore={results?.session?.ai_band_score}
              criteriaScores={parsedFeedback?.criteriaScores}
              testDate={new Date(results?.session?.completed_at).toLocaleDateString()}
              testType="Full IELTS Speaking Test"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-6 md:space-y-8">
                <TranscriptViewer
                  responses={results?.responses}
                />
              </div>

              <div className="space-y-6 md:space-y-8">
                <FeedbackPanel
                  feedback={parsedFeedback?.feedback}
                  strengths={parsedFeedback?.strengths}
                  improvements={parsedFeedback?.improvements}
                />
              </div>
            </div>

            <VocabularyEnhancement
              recommendations={[]}
              topicWords={[]}
              phrases={[]}
            />

            <div className="bg-card rounded-lg p-6 md:p-8 shadow-md border border-border">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="CheckCircle" size={24} color="var(--color-success)" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">
                      Ready for Your Next Practice?
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground font-caption">
                      Use the feedback above to improve your performance. Regular practice is key to achieving your target band score.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    iconName="Save"
                    iconPosition="left"
                    onClick={handleSaveResults}
                    loading={isSaving}
                    fullWidth
                  >
                    Save Results
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    iconName="History"
                    iconPosition="left"
                    onClick={handleViewHistory}
                    fullWidth
                  >
                    View History
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    iconName="RotateCcw"
                    iconPosition="left"
                    onClick={handleRetakeTest}
                    fullWidth
                  >
                    Retake Test
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AIFeedbackResults;