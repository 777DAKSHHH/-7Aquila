import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegPath);

export const detectSilence = (filePath) => {
  return new Promise((resolve, reject) => {
    const nullDevice = os.platform() === 'win32' ? 'NUL' : '/dev/null';

    ffmpeg(filePath)
      .audioFilters('volumedetect')
      .format('null')
      .output(nullDevice)
      .on('end', (stdout, stderr) => {
        // ffmpeg outputs volumedetect info to stderr
        const maxVolumeMatch = stderr.match(/max_volume: ([\-\d.]+) dB/);
        
        if (maxVolumeMatch) {
          const maxVolume = parseFloat(maxVolumeMatch[1]);
          // If max volume is below -50dB, consider it silent
          resolve(maxVolume < -50);
        } else {
          resolve(false);
        }
      })
      .on('error', (err) => {
        console.warn('Silence detection warning:', err.message);
        // Fallback to assuming audio exists if check fails to avoid blocking uploads
        resolve(false);
      })
      .run();
  });
};

