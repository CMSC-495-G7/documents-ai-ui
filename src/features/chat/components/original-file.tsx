import {
  DocumentPreview,
  documentKindOf,
  Notice,
} from '@radixp0int/ai-chat-kit';
import type { ReferenceOriginalProps } from '@radixp0int/ai-chat-kit/chat';
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../common/api/http-client.ts';

type OriginalFileProps = Omit<ReferenceOriginalProps, 'source'> & {
  title: string;
  documentId: number;
  // The cited page. null for Word files
  page: number | null;
  loadFile: (documentId: number) => Promise<Blob>;
};

type FileState =
  | { state: 'loading' }
  | { state: 'loaded'; file: Blob }
  | { state: 'failed'; error: unknown };

function fileErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "This document isn't available anymore. The excerpt is all that's left.";
    }
    // 502: the dev proxy's answer when the API is down
    if (error.status === 0 || error.status === 502) {
      return 'Could not reach the server.';
    }
  }
  return "Couldn't open the document. Try again.";
}

// The cited file in the sources panel's Original view.
// It needs the token, so it's fetched as a Blob instead of a plain link.
export function OriginalFile({
  title,
  documentId,
  page,
  loadFile,
  zoom,
  onLoad,
  onPageChange,
  onError,
}: OriginalFileProps) {
  const [file, setFile] = useState<FileState>({ state: 'loading' });
  const [pageCount, setPageCount] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const loading = file.state === 'loading';

  // Runs on open and again on Try again
  useEffect(() => {
    if (!loading) return;
    let cancelled = false;
    loadFile(documentId).then(
      (loaded) => {
        if (!cancelled) setFile({ state: 'loaded', file: loaded });
      },
      (error: unknown) => {
        if (!cancelled) setFile({ state: 'failed', error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [documentId, loadFile, loading]);

  // The kit opens a PDF at page 1. Once its pages are laid out, scroll to the
  // cited one. Pages are the same height, so it's a fraction of the scroll.
  useEffect(() => {
    if (!page || !pageCount || page > pageCount) return;
    const frame = requestAnimationFrame(() => {
      const scroller =
        box.current?.querySelector<HTMLElement>('[role="group"]');
      if (scroller) {
        scroller.scrollTop = ((page - 1) * scroller.scrollHeight) / pageCount;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [page, pageCount]);

  function retry() {
    setFile({ state: 'loading' });
  }

  if (file.state === 'loading') {
    return (
      <p role="status" className="p-5 text-sm text-ink-soft">
        Opening the document…
      </p>
    );
  }
  if (file.state === 'failed') {
    const gone = file.error instanceof ApiError && file.error.status === 404;
    return (
      <div className="p-4">
        <Notice
          tone="error"
          action={gone ? undefined : { label: 'Try again', onClick: retry }}
        >
          {fileErrorMessage(file.error)}
        </Notice>
      </div>
    );
  }

  const kind = documentKindOf(file.file.type);
  if (!kind) {
    return (
      <div className="p-4">
        <Notice tone="error">This file type can't be shown here.</Notice>
      </div>
    );
  }
  return (
    <div ref={box} className="flex min-h-0 flex-1 flex-col">
      <DocumentPreview
        src={file.file}
        kind={kind}
        title={title}
        zoom={zoom}
        onLoad={(info) => {
          onLoad(info);
          if (info.pageCount) setPageCount(info.pageCount);
        }}
        onPageChange={onPageChange}
        onError={onError}
      />
    </div>
  );
}
