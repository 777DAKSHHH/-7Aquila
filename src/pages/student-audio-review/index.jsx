import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import TopNav from '../../components/ui/TopNav';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import StudentInfoHeader from './components/StudentInfoHeader';
import AudioPlayerWithWaveform from './components/AudioPlayerWithWaveform';
import TranscriptViewer from './components/TranscriptViewer';
import FeedbackPanel from './components/FeedbackPanel';
import AIAssessmentDetails from './components/AIAssessmentDetails';

// Helper to parse AI feedback string into structured data
const parseAIFeedback = (feedbackText) => {
  if (!feedbackText) return null;

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
    const match = content.match(/(\d+(\.\d+)?)/);
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
  
  const improvementsContent = getSectionContent('areas for improvement', null);
  const globalImprovements = improvementsContent
    .split('\n')
    .map(line => line.replace(/^-/, '').trim())
    .filter(line => line.length > 0 && !line.toLowerCase().includes('overall band score'));

  return {
    scores: {
      overall: getScore(getSectionContent('Overall Band Score', null)) || 0,
      fluency: getScore(fluencyContent),
      lexical: getScore(lexicalContent),
      grammar: getScore(grammarContent),
      pronunciation: getScore(pronunciationContent)
    },
    assessment: {
      fluency: { score: getScore(fluencyContent), details: getExplanation(fluencyContent), strengths: [], improvements: [] },
      lexical: { score: getScore(lexicalContent), details: getExplanation(lexicalContent), strengths: [], improvements: [] },
      grammar: { score: getScore(grammarContent), details: getExplanation(grammarContent), strengths: [], improvements: [] },
      pronunciation: { score: getScore(pronunciationContent), details: getExplanation(pronunciationContent), strengths: [], improvements: [] },
      overallRecommendation: globalImprovements.join(" ")
    }
  };
};

const StudentAudioReview = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [responses, setResponses] = useState([]);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch session with student profile
        const { data: session, error: sessionError } = await supabase
          .from('speaking_sessions')
          .select('*, profiles:student_id(*)')
          .eq('id', attemptId)
          .maybeSingle();

        if (sessionError) throw sessionError;

        // Fetch responses
        const { data: responseList, error: respError } = await supabase
          .from('speaking_responses')
          .select('*, speaking_questions(*)')
          .eq('session_id', attemptId)
          .order('created_at', { ascending: true });

        if (respError) throw respError;

        // Get public URLs for audio
        const responsesWithUrls = responseList.map(r => {
          if (r.audio_path) {
            const { data } = supabase.storage.from('sessions').getPublicUrl(r.audio_path);
            return { ...r, audioUrl: data.publicUrl };
          }
          return r;
        });

        setSessionData(session);
        setResponses(responsesWithUrls);
        
        if (session.ai_feedback) {
          setAiData(parseAIFeedback(session.ai_feedback));
        }

      } catch (err) {
        console.error("Error fetching review data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) fetchData();
  }, [attemptId]);

  const handleSaveFeedback = async (feedbackData) => {
    try {
      // In a real app, you might save this to a 'faculty_feedback' table or column
      console.log("Saving feedback:", feedbackData);
      alert("Feedback saved (simulated)");
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  const handleSendToStudent = () => {
    // Logic to notify student would go here
    alert("Feedback sent to student (simulated)");
  };

  const handleAddComment = () => {
    setShowCommentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader" className="animate-spin text-primary mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-foreground">Loading Review Data...</h2>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  const student = sessionData.profiles || { name: "Unknown Student", email: "N/A" };
  // Use the first response for the main player/transcript for now, or concat
  // For this view, let's display the longest response (likely Part 2) or default to the first
  const primaryResponse = responses.length > 0 
    ? responses.reduce((prev, current) => (prev.audio_duration > current.audio_duration) ? prev : current)
    : null;
  
  // Concatenate all transcripts for the viewer if desired, or just show the primary one
  const fullTranscript = responses.map(r => 
    `[Part ${r.speaking_questions?.part || '?'}] ${r.speaking_questions?.question_text || ''}\n${r.transcript || '(No transcript)'}`
  ).join('\n\n');

  return (
    <div className="min-h-screen bg-background">
      <TopNav userRole="faculty" />

      <div className="container-safe py-6 md:py-8 lg:py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold text-foreground mb-2">
              Student Audio Review
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-caption">
              Review student recording and provide detailed feedback
            </p>
          </div>
          <Button
            variant="outline"
            iconName="ArrowLeft"
            iconPosition="left"
            onClick={() => navigate('/faculty-dashboard')}>

            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6 md:space-y-8">
          <StudentInfoHeader
            student={{
              name: student.full_name || student.email?.split('@')[0],
              studentId: student.id.substring(0, 8).toUpperCase(),
              email: student.email,
              avatar: student.avatar_url,
              avatarAlt: student.full_name
            }}
            testDetails={{
              date: new Date(sessionData.created_at).toLocaleDateString(),
              topic: responses[0]?.speaking_questions?.topic || "IELTS Speaking Test",
              duration: "N/A", // Calculate total duration if needed
              testType: "Full Test"
            }}
            aiScores={aiData?.scores} />

          <AudioPlayerWithWaveform
            audioUrl={primaryResponse?.audioUrl || ""}
            duration={primaryResponse?.audio_duration || 0}
            onAddComment={handleAddComment} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Pass full concatenated transcript or just the primary one */}
            <TranscriptViewer transcript={fullTranscript || "No recording available."} highlights={[]} />
            <AIAssessmentDetails assessment={aiData?.assessment} />
          </div>

          <FeedbackPanel
            onSaveFeedback={handleSaveFeedback}
            onSendToStudent={handleSendToStudent}
            existingFeedback={null} />

        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-caption">
              <Icon name="Clock" size={16} />
              <span>Last reviewed: Never</span>
            </div>
            <div className="flex flex-wrap gap-3 justify-center md:justify-end">
              <Button variant="outline" iconName="Download" iconPosition="left">
                Download Audio
              </Button>
              <Button variant="outline" iconName="FileText" iconPosition="left">
                Export Report
              </Button>
              <Button variant="outline" iconName="Share2" iconPosition="left">
                Share with Colleagues
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showCommentModal &&
      <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg border border-border max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-foreground">Add Comment</h3>
              <button
              onClick={() => setShowCommentModal(false)}
              className="p-1 hover:bg-muted rounded-md transition-colors duration-base">

                <Icon name="X" size={20} />
              </button>
            </div>
            <textarea
            placeholder="Enter your comment at this timestamp..."
            className="w-full min-h-[120px] p-3 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus-ring resize-none mb-4" />

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setShowCommentModal(false)}>
                Cancel
              </Button>
              <Button variant="default" fullWidth onClick={() => setShowCommentModal(false)}>
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      }
    </div>);

};

export default StudentAudioReview;