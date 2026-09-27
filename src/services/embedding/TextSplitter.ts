export class TextSplitter {
  /**
   * Splits text into chunks of maximum size with an overlap.
   * Basic implementation that splits by word boundaries to avoid cutting words in half when possible.
   */
  static splitText(text: string, chunkSize: number = 500, chunkOverlap: number = 50): string[] {
    if (!text || chunkSize <= 0) return [];
    
    // Safety check for overlap
    if (chunkOverlap >= chunkSize) {
      chunkOverlap = Math.floor(chunkSize / 2);
    }

    const chunks: string[] = [];
    let i = 0;

    while (i < text.length) {
      let end = i + chunkSize;

      if (end < text.length) {
        let breakPoint = end;
        const searchRange = Math.max(1, Math.floor(chunkSize * 0.2));
        for (let j = end; j > end - searchRange; j--) {
          if (text[j] === '\n' || text[j] === ' ') {
            breakPoint = j;
            break;
          }
        }
        end = breakPoint;
      }

      chunks.push(text.slice(i, end).trim());
      
      // Advance 'i'. If for some reason we didn't advance, force it.
      let nextI = end - chunkOverlap;
      if (nextI <= i) {
        nextI = i + 1; // force advance to avoid infinite loop
      }
      i = nextI;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }
}
