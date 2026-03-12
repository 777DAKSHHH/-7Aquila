export const processAudioFile = ({ file, metadata }) => {
  return {
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    metadata,
    storedAt: "/uploads/speaking",
  };
};
