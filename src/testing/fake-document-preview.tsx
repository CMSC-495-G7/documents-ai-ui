import type { DocumentPreviewProps } from '@radixp0int/ai-chat-kit';
import { useEffect, useRef } from 'react';

// jsdom can't draw a PDF, so tests swap the kit's DocumentPreview for this:
//   vi.mock('@radixp0int/ai-chat-kit', ...) (see original-file.test.tsx)
// It shows what it was given and says a PDF has 4 pages.
export function FakeDocumentPreview({
  src,
  kind,
  title,
  onLoad,
}: DocumentPreviewProps) {
  const reported = useRef(false);
  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    onLoad?.({ pageCount: kind === 'pdf' ? 4 : undefined });
  }, [kind, onLoad]);

  const type = src instanceof Blob ? src.type : 'not a file';
  return (
    <div role="group" aria-label={`Original document: ${title}`}>
      {kind} preview of {type}
    </div>
  );
}
