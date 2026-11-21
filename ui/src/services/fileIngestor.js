import { parsePDF, parseMarkdown, parseAudio } from './ingestorApi';

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.webm', '.opus', '.wma'];

export async function parseFileClientSide(file) {
  try {
    const lowerName = file.name.toLowerCase();
    const isAudio = AUDIO_EXTENSIONS.some(ext => lowerName.endsWith(ext));

    if (isAudio) {
      const resp = await parseAudio(file);
      return {
        title: resp.title || file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
        content: resp.text || resp.content || '',
        type: 'audio'
      };
    } else if (lowerName.endsWith('.pdf')) {
      const resp = await parsePDF(file);
      return {
        title: resp.title || file.name.replace('.pdf', ''),
        filename: file.name,
        content: resp.text || '',
        type: 'pdf'
      };
    } else {
      const resp = await parseMarkdown(file);
      return {
        title: resp.title || file.name,
        filename: file.name,
        content: resp.text || '',
        type: 'file'
      };
    }
  } catch (err) {
    console.error("Backend ingestor failed:", err);
    throw err;
  }
}

export function parseYouTubeURL(url) {
  const match = url.match(/(?:v=|\/([0-9A-Za-z_-]{11})|youtu\.be\/)([0-9A-Za-z_-]{11})/);
  const videoId = match ? (match[1] || match[2]) : 'unknown';
  
  return {
    title: `YouTube Transcript [${videoId}]`,
    url: url,
    videoId: videoId,
    text: `Transcript for YouTube video (${url}): Automatically ingested source into SourceBook notebook.`,
    type: 'youtube'
  };
}
