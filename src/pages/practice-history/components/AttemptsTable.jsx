import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../supabaseClient';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


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
            speaking_questions ( part )
          )
        `)
        .eq('id', attempt?.id)
        .single();

      if (error) throw error;

      if (!session || !session.speaking_responses || session.speaking_responses.length === 0) {
        alert('No recordings found for this attempt.');
        return;
      }

      const zip = new JSZip();
      // Format the folder/file name: topic-speaking-date (e.g. teachers-speaking-5-17-2026)
      const safeTopic = (attempt?.topic || 'practice').replace(/\s+/g, '-').toLowerCase();
      const safeDate = attempt?.date ? attempt.date.replace(/\//g, '-') : 'unknown-date';
      const folderName = `${safeTopic}-speaking-${safeDate}`;
      const folder = zip.folder(folderName);

      // Sort responses chronologically to ensure they are downloaded in order (Response_1, Response_2, etc.)
      const responses = session.speaking_responses.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      // 2. Fetch all audio blobs and add to zip concurrently
      await Promise.all(responses.map(async (response, index) => {
        if (!response.audio_path) return;
        
        const { data: urlData } = await supabase.storage.from('speaking-audio').createSignedUrl(response.audio_path, 3600);
        if (!urlData?.signedUrl) return;

        const audioRes = await fetch(urlData.signedUrl);
        const audioBlob = await audioRes.blob();

        // Name the file: PartX_Response_Y.webm
        const part = response.speaking_questions?.part ? `Part${response.speaking_questions.part}_` : '';
        folder.file(`${part}Response_${index + 1}.webm`, audioBlob);
      }));

      // Add a scores summary text file to the zip
      const scoresText = `IELTS Speaking Practice Results\n` +
        `Date: ${attempt?.date || 'N/A'}\n` +
        `Topic: ${attempt?.topic || 'N/A'}\n\n` +
        `Scores:\n` +
        `Overall Band: ${attempt?.overallScore || 'N/A'}\n` +
        `Fluency & Coherence: ${attempt?.fluency || 'N/A'}\n` +
        `Lexical Resource: ${attempt?.lexical || 'N/A'}\n` +
        `Grammar Range & Accuracy: ${attempt?.grammar || 'N/A'}\n` +
        `Pronunciation: ${attempt?.pronunciation || 'N/A'}\n`;
      
      folder.file('scores.txt', scoresText);

      // 3. Generate & Download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
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
                <td colSpan="8" className="p-8 text-center">
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
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{attempt?.topic}</span>
                      <span className="text-xs text-muted-foreground font-caption">
                        {attempt?.topicType}
                      </span>
                    </div>
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