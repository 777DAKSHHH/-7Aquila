import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../supabaseClient';
import { saveAs } from 'file-saver';
import { ZipWriter, BlobWriter, BlobReader, TextReader } from '@zip.js/zip.js';


const AttemptsTable = ({ attempts = [], onSort = () => {} }) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [playingId, setPlayingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    onSort(field, newDirection);
  };

  const handlePlayAudio = (id) => {
    setPlayingId(playingId === id ? null : id);
    // Audio playback logic would go here
  };

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-error';
  };

  const handleDownloadZip = async (attempt) => {
    try {
      setDownloadingId(attempt?.id);

      // 1. Fetch all responses for this specific attempt from Supabase
      const { data: session, error } = await supabase
        .from('speaking_sessions')
        .select(`
          *,
          speaking_responses (
            *,
            speaking_questions ( part, topic, question_text, difficulty )
          )
        `)
        .eq('id', attempt?.id)
        .single();

      if (error) throw error;

      if (!session || !session.speaking_responses || session.speaking_responses.length === 0) {
        alert('No recordings found for this attempt.');
        return;
      }

      const zipWriter = new ZipWriter(new BlobWriter("application/zip"), { password: "JAN7MMVI" });

      const safeTopic = (attempt?.topic || 'practice').replace(/\s+/g, '-').toLowerCase();
      const safeDate = attempt?.date ? attempt.date.replace(/\//g, '-') : 'unknown-date';
      const folderName = `${safeTopic}-speaking-${safeDate}`;

      // Sort responses chronologically to ensure they are downloaded in order (Response_1, Response_2, etc.)
      const responses = session.speaking_responses.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      // 2. Fetch all audio blobs concurrently
      const downloadedFiles = await Promise.all(responses.map(async (response, index) => {
        if (!response.audio_path) return null;
        
        const { data: urlData } = await supabase.storage.from('speaking-audio').createSignedUrl(response.audio_path, 3600);
        if (!urlData?.signedUrl) return null;

        const audioRes = await fetch(urlData.signedUrl);
        const audioBlob = await audioRes.blob();

        // Name the file: PartX_Response_Y.webm
        const part = response.speaking_questions?.part ? `Part${response.speaking_questions.part}_` : '';
        return { path: `${folderName}/${part}Response_${index + 1}.webm`, blob: audioBlob };
      }));

      // Add fetched files to the encrypted zip sequentially
      for (const file of downloadedFiles) {
        if (file) {
          await zipWriter.add(file.path, new BlobReader(file.blob));
        }
      }

      // Add a scores summary text file to the zip
      let ai = session.ai_detailed_feedback;
      if (typeof ai === 'string') {
        try { ai = JSON.parse(ai); } catch (e) {}
      }
      const errors = ai?.errors || [];
      const idealAnswers = ai?.ideal_answers || [];

      let scoresText = `======================================================\n`;
      scoresText += `              IELTS SPEAKING TEST RESULTS             \n`;
      scoresText += `======================================================\n\n`;

      scoresText += `Test Date: ${attempt?.date || 'N/A'}\n`;
      scoresText += `Overall Band Score: ${attempt?.overallScore || 'N/A'}\n\n`;
      
      scoresText += `--- Criteria Scores ---\n`;
      scoresText += `Fluency & Coherence: ${attempt?.fluency || 'N/A'}\n`;
      scoresText += `Lexical Resource: ${attempt?.lexical || 'N/A'}\n`;
      scoresText += `Grammatical Range & Accuracy: ${attempt?.grammar || 'N/A'}\n`;
      scoresText += `Pronunciation: ${attempt?.pronunciation || 'N/A'}\n\n`;

      scoresText += `======================================================\n`;
      scoresText += `             QUESTION & RESPONSE ANALYSIS             \n`;
      scoresText += `======================================================\n\n`;

      responses.forEach((response, index) => {
        const q = response.speaking_questions || {};
        const topic = q.topic || 'N/A';
        const difficulty = q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : 'N/A';
        const questionText = q.question_text || 'N/A';
        
        scoresText += `[Part ${q.part || 'Unknown'}] - Question ${index + 1}\n`;
        scoresText += `Topic: ${topic} | Difficulty: ${difficulty}\n`;
        scoresText += `Question: ${questionText}\n\n`;
        
        const ideal = idealAnswers.find(ia => ia.question === questionText);
        if (ideal) {
          scoresText += `--- Ideal Band 7+ Answer ---\n`;
          scoresText += `${ideal.ideal_answer}\n\n`;
        }
      });

      if (errors.length > 0) {
        scoresText += `======================================================\n`;
        scoresText += `                   ERROR ANALYSIS                     \n`;
        scoresText += `======================================================\n\n`;
        
        errors.forEach((err, index) => {
          scoresText += `${index + 1}. You said: "${err.original}"\n`;
          scoresText += `   Correction: "${err.correction}"\n`;
          scoresText += `   Explanation: ${err.explanation}\n\n`;
        });
      }
      
      await zipWriter.add(`${folderName}/scores.txt`, new TextReader(scoresText));

      // 3. Generate & Download ZIP
      const zipBlob = await zipWriter.close();
      saveAs(zipBlob, `${folderName}.zip`);
    } catch (err) {
      console.error("Error downloading zip:", err);
      alert("Failed to download recordings. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <Icon name="ChevronsUpDown" size={14} />;
    return <Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-2 hover:text-primary transition-colors duration-base"
                >
                  Date
                  <SortIcon field="date" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                <button
                  onClick={() => handleSort('topic')}
                  className="flex items-center gap-2 hover:text-primary transition-colors duration-base"
                >
                  Topic
                  <SortIcon field="topic" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                <button
                  onClick={() => handleSort('topicType')}
                  className="flex items-center gap-2 hover:text-primary transition-colors duration-base"
                >
                  Category
                  <SortIcon field="topicType" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                <button
                  onClick={() => handleSort('difficulty')}
                  className="flex items-center gap-2 hover:text-primary transition-colors duration-base"
                >
                  Difficulty
                  <SortIcon field="difficulty" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                <button
                  onClick={() => handleSort('overallScore')}
                  className="flex items-center gap-2 hover:text-primary transition-colors duration-base"
                >
                  Overall
                  <SortIcon field="overallScore" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Fluency
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Lexical
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Grammar
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Pronunciation
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {attempts?.length === 0 ? (
              <tr>
                <td colSpan="10" className="p-8 text-center">
                  <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground font-caption">No practice attempts found</p>
                </td>
              </tr>
            ) : (
              attempts?.map((attempt) => (
                <tr
                  key={attempt?.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors duration-base"
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{attempt?.date}</span>
                      <span className="text-xs text-muted-foreground font-caption">
                        {attempt?.duration}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-foreground max-w-[200px] line-clamp-2" title={attempt?.topic}>
                      {attempt?.topic || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">
                      {attempt?.topicType || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      attempt?.difficulty?.toLowerCase() === 'hard' ? 'bg-error/10 text-error' :
                      attempt?.difficulty?.toLowerCase() === 'medium' ? 'bg-warning/10 text-warning' :
                      attempt?.difficulty?.toLowerCase() === 'easy' ? 'bg-success/10 text-success' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {attempt?.difficulty || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-lg font-heading font-bold ${getScoreColor(attempt?.overallScore)}`}>
                      {attempt?.overallScore}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-semibold ${getScoreColor(attempt?.fluency)}`}>
                      {attempt?.fluency}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-semibold ${getScoreColor(attempt?.lexical)}`}>
                      {attempt?.lexical}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-semibold ${getScoreColor(attempt?.grammar)}`}>
                      {attempt?.grammar}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-semibold ${getScoreColor(attempt?.pronunciation)}`}>
                      {attempt?.pronunciation}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePlayAudio(attempt?.id)}
                        className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring"
                        aria-label={playingId === attempt?.id ? 'Pause audio' : 'Play audio'}
                      >
                        <Icon
                          name={playingId === attempt?.id ? 'Pause' : 'Play'}
                          size={16}
                          color="var(--color-primary)"
                        />
                      </button>
                      <Link to={`/ai-feedback-results/${attempt?.id}`}>
                        <button
                          className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring"
                          aria-label="View details"
                        >
                          <Icon name="Eye" size={16} color="var(--color-primary)" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDownloadZip(attempt)}
                        disabled={downloadingId === attempt?.id}
                        className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring"
                        aria-label="Download recording"
                      >
                        {downloadingId === attempt?.id ? (
                          <Icon name="Loader" size={16} className="animate-spin text-primary" />
                        ) : (
                          <Icon name="Download" size={16} color="var(--color-primary)" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttemptsTable;