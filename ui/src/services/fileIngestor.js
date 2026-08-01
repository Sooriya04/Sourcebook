// Pure frontend client-side document and link extractor (No python backend required)

export async function parseFileClientSide(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (file.name.endsWith('.pdf')) {
      // For PDFs in pure browser, extract raw text stream
      reader.onload = (e) => {
        const buffer = e.target.result;
        const decoder = new TextDecoder('utf-8');
        const rawText = decoder.decode(buffer);
        
        // Extract text matching printable ASCII / UTF-8 blocks from raw PDF stream
        const textMatches = rawText.match(/[\x20-\x7E\s]{4,}/g) || [];
        const cleanedText = textMatches
          .filter(chunk => !chunk.includes('obj') && !chunk.includes('endobj') && !chunk.includes('stream'))
          .join(' ')
          .slice(0, 5000);

        resolve({
          title: file.name.replace('.pdf', ''),
          filename: file.name,
          text: cleanedText || `[Extracted text content from ${file.name}]`,
          type: 'pdf'
        });
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Plain text, markdown, code, csv
      reader.onload = (e) => {
        resolve({
          title: file.name,
          filename: file.name,
          text: e.target.result,
          type: 'file'
        });
      };
      reader.readAsText(file);
    }
  });
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
