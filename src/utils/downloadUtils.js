import { supabase } from '../supabaseClient.js';
import { saveAs } from 'file-saver';
import { ZipWriter, BlobWriter, BlobReader, TextReader } from '@zip.js/zip.js';
import { getAttemptScores } from './scoreUtils';

export const downloadAttemptZip = async (attempt) => {
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
    throw new Error('No recordings found for this attempt.');
  }

  const zipWriter = new ZipWriter(new BlobWriter("application/zip"));
  const safeTopic = (attempt?.topic || 'practice').replace(/\s+/g, '-').toLowerCase();
  const safeDate = attempt?.date ? attempt.date.replace(/\//g, '-') : 'unknown-date';
  const folderName = `${safeTopic}-speaking-${safeDate}`;

  const responses = session.speaking_responses.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // 2. Fetch all audio blobs concurrently
  const downloadedFiles = await Promise.all(responses.map(async (response, index) => {
    if (!response.audio_path) return null;
    
    const { data: urlData } = await supabase.storage.from('speaking-audio').createSignedUrl(response.audio_path, 3600);
    if (!urlData?.signedUrl) return null;

    const audioRes = await fetch(urlData.signedUrl);
    const audioBlob = await audioRes.blob();

    const part = response.speaking_questions?.part ? `Part${response.speaking_questions.part}_` : '';
    return { path: `${folderName}/${part}Response_${index + 1}.webm`, blob: audioBlob };
  }));

  for (const file of downloadedFiles) {
    if (file) {
      await zipWriter.add(file.path, new BlobReader(file.blob));
    }
  }

  const scores = getAttemptScores(attempt);

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

  scoresText += `Test Date: ${scores.date || 'N/A'}\n`;
  scoresText += `Overall Band Score: ${scores.overall || 'N/A'}\n\n`;
  
  scoresText += `--- Criteria Scores ---\n`;
  scoresText += `Fluency & Coherence: ${scores.fluency || 'N/A'}\n`;
  scoresText += `Lexical Resource: ${scores.lexical || 'N/A'}\n`;
  scoresText += `Grammatical Range & Accuracy: ${scores.grammar || 'N/A'}\n`;
  scoresText += `Pronunciation: ${scores.pronunciation || 'N/A'}\n\n`;

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
};