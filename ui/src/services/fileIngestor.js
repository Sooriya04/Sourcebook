import { parsePDF, parseMarkdown } from './ingestorApi';

export async function parseFileClientSide(file) {
  try {
    if (file.name.endsWith('.pdf')) {
      const resp = await parsePDF(file);
      return {
        title: resp.title || file.name.replace('.pdf', ''),
        filename: file.name,
        text: resp.text || '',
        type: 'pdf'
      };
    } else {
      const resp = await parseMarkdown(file);
      return {
        title: resp.title || file.name,
        filename: file.name,
        text: resp.text || '',
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
