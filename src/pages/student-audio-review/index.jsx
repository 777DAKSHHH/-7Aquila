import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import TopNav from '../../components/ui/TopNav';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import StudentInfoHeader from './components/StudentInfoHeader';
import TranscriptViewer from '../ai-feedback-results/components/TranscriptViewer';
import FeedbackPanel from './components/FeedbackPanel';
import AIAssessmentDetails from './components/AIAssessmentDetails';

// Helper to parse AI feedback string into structured data
const parseAIFeedback = (feedbackText) => {
  if (!feedbackText) return null;

  const getSectionContent = (startMarkers, endMarkers) => {
    const markers = Array.isArray(startMarkers) ? startMarkers : [startMarkers];
    let startIndex = -1;
    let markerLength = 0;

    for (const marker of markers) {
      const index = feedbackText.toLowerCase().indexOf(marker.toLowerCase());
      if (index !== -1) {
        if (startIndex === -1 || index < startIndex) {
          startIndex = index;
          markerLength = marker.length;
        }
      }
    }

    if (startIndex === -1) return '';

    let endIndex = -1;
    if (endMarkers) {
      const eMarkers = Array.isArray(endMarkers) ? endMarkers : [endMarkers];
      for (const marker of eMarkers) {
        const index = feedbackText.toLowerCase().indexOf(marker.toLowerCase(), startIndex + markerLength);
        if (index !== -1 && (endIndex === -1 || index < endIndex)) {
          endIndex = index;
        }
      }
    }

    const content = feedbackText.substring(
      startIndex + markerLength,
      endIndex !== -1 ? endIndex : undefined
    );
    return content.replace(/^[:\-\s]+/, '').trim();
  };

  const getScore = (content) => {
    const match = content.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const getExplanation = (content) => {
    return content.replace(/^(band\s*score)?\s*[:\-]?\s*\d+(\.\d+)?\s*[:\-]?\s*/i, '').trim();
  };

  const fluencyContent = getSectionContent(['Fluency and Coherence', 'Fluency & Coherence'], ['Lexical Resource', 'Vocabulary']);
  const lexicalContent = getSectionContent(['Lexical Resource', 'Vocabulary'], ['Grammatical Range and Accuracy', 'Grammar']);
  const grammarContent = getSectionContent(['Grammatical Range and Accuracy', 'Grammar'], ['Pronunciation']);
  const pronunciationContent = getSectionContent(['Pronunciation'], ['Overall Band Score', 'Areas for improvement', 'Suggestions']);

  const strengthsContent = getSectionContent(
    ['strengths', 'key strengths'], 
    ['areas for improvement', 'suggestions for improvement', 'improvements', 'weaknesses', 'overall recommendation', 'conclusion']
  );
  
  const improvementsContent = getSectionContent(
    ['areas for improvement', 'suggestions for improvement', 'improvements', 'weaknesses'], 
    ['overall recommendation', 'overall band score', 'conclusion']
  );

  const globalImprovements = improvementsContent
    .split('\n')
    .map(line => line.replace(/^[-\*\d\.]+\s*/, '').trim())
    .filter(line => line.length > 0 && !line.toLowerCase().includes('overall band score'));

  const globalStrengths = strengthsContent
    .split('\n')
    .map(line => line.replace(/^[-\*\d\.]+\s*/, '').trim())
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
      overallRecommendation: globalImprovements.join(" "),
      strengths: globalStrengths
    }
  };
};

const StudentAudioReview = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [commentData, setCommentData] = useState(null);
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
          .select(`
            *,
            speaking_questions:question_id (
              id,
              question_text,
              part
            )
          `)
          .eq('session_id', attemptId)
          .order('created_at', { ascending: true });

        if (respError) throw respError;

        // Get signed URLs for audio (private bucket)
        const responsesWithUrls = await Promise.all(
          responseList.map(async (r) => {
            const qObj = Array.isArray(r.speaking_questions) 
              ? r.speaking_questions[0] 
              : r.speaking_questions;

            let audioUrl = null;
            if (r.audio_path) {
              const { data, error } = await supabase.storage
                .from("speaking-audio")
                .createSignedUrl(r.audio_path, 3600);

              if (!error) {
                audioUrl = data?.signedUrl || null;
              } else {
                console.error("Signed URL error:", error);
              }
            }

            return { 
              ...r, 
              audioUrl,
              question_text: qObj?.question_text || "Question not available",
              part: qObj?.part || null
            };
          })
        );

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

  const handleAddComment = (responseId, time) => {
    setCommentData({ responseId, time });
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <TranscriptViewer responses={responses} onAddComment={handleAddComment} />
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

      {commentData &&
      <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg border border-border max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-foreground">Add Comment at {Math.floor(commentData.time / 60)}:{String(Math.floor(commentData.time % 60)).padStart(2, '0')}</h3>
              <button
              onClick={() => setCommentData(null)}
              className="p-1 hover:bg-muted rounded-md transition-colors duration-base">

                <Icon name="X" size={20} />
              </button>
            </div>
            <textarea
            placeholder="Enter your comment at this timestamp..."
            className="w-full min-h-[120px] p-3 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus-ring resize-none mb-4" />

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setCommentData(null)}>
                Cancel
              </Button>
              <Button variant="default" fullWidth onClick={() => setCommentData(null)}>
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      }
    </div>);

};

export default StudentAudioReview;