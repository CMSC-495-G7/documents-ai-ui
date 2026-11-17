import {
  Button,
  InSideMenu,
  Notice,
  ResizableColumn,
  SlideOver,
  useMediaQuery,
} from '@radixp0int/ai-chat-kit';
import {
  BrandingProvider,
  CitationsProvider,
  Conversation,
  Greeting,
  ReferencePanel,
  useChat,
  type CiteHandler,
  type Highlight,
  type ReferenceOriginalProps,
  type Source,
} from '@radixp0int/ai-chat-kit/chat';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../common/api/http-client.ts';
import { paths } from '../../../common/config/paths.ts';
import { TopBarActions } from '../../../common/top-bar/top-bar-slot.tsx';
import { AnswerHistory } from '../components/answer-history.tsx';
import { OriginalFile } from '../components/original-file.tsx';
import { useAnswerHistory } from '../hooks/use-answer-history.ts';
import { useDocumentFiles } from '../hooks/use-document-files.ts';
import { useSavedAnswer } from '../hooks/use-saved-answer.ts';
import type { CitedSource } from '../types.ts';
import { askResponder } from '../utils/ask-responder.ts';
import { savedTurn } from '../utils/saved-turn.ts';

const branding = {
  appName: 'DocumentsAI',
  modelName: 'DocumentsAI',
  disclaimer: 'Select a number in an answer to see the source.',
};

type OpenReference = {
  sources: Source[];
  activeId: number;
  highlights?: Highlight[];
};

// "/chat/12" gives 12, "/chat" gives null
function readAnswerId(param: string | undefined) {
  if (param === undefined) return null;
  const id = Number(param);
  // Anything else ("/chat/abc") asks for answer 0, which is a 404
  return Number.isInteger(id) && id > 0 ? id : 0;
}

// /chat starts empty. /chat/:answerId opens a saved answer.
export function ChatPage() {
  const params = useParams();
  const location = useLocation();
  const answerId = readAnswerId(params.answerId);
  const history = useAnswerHistory();

  return (
    <>
      <InSideMenu>
        <AnswerHistory
          items={history.items}
          failed={history.failed}
          activeId={answerId}
          onRetry={history.reload}
        />
      </InSideMenu>
      {/* Every navigation has a new key, even /chat to /chat (New chat).
          A new key starts a fresh conversation. */}
      <ChatSession
        key={location.key}
        answerId={answerId}
        onAnswered={history.reload}
      />
    </>
  );
}

type ChatSessionProps = {
  answerId: number | null;
  // Runs after each answer, so the history list picks it up
  onAnswered: () => void;
};

// memo: a history refresh shouldn't redraw the conversation
const ChatSession = memo(function ChatSession({
  answerId,
  onAnswered,
}: ChatSessionProps) {
  const chat = useChat(askResponder);
  const { saved, retry } = useSavedAnswer(answerId);
  const loadFile = useDocumentFiles();
  const navigate = useNavigate();
  const [reference, setReference] = useState<OpenReference | null>(null);
  const wide = useMediaQuery('(min-width: 64rem)', true);

  // The saved answer first, then anything asked after it
  const messages = useMemo(
    () =>
      saved.state === 'loaded'
        ? [...savedTurn(saved.answer), ...chat.messages]
        : chat.messages,
    [saved, chat.messages],
  );

  // busy goes from true to false when an answer (or an error) is in
  const wasBusy = useRef(false);
  useEffect(() => {
    if (wasBusy.current && !chat.busy) onAnswered();
    wasBusy.current = chat.busy;
  }, [chat.busy, onAnswered]);

  const openReference: CiteHandler = (sources, activeId, highlights) =>
    setReference({ sources, activeId, highlights });

  function closeReference() {
    setReference(null);
  }

  // A new location key gives a fresh ChatSession, so this is all it takes
  function startNewChat() {
    navigate(paths.chat);
  }

  // The Original view in the sources panel
  const renderOriginal = useCallback(
    ({ source, ...view }: ReferenceOriginalProps) => {
      // Our sources come from toSources, so they're CitedSources
      const { documentId, page } = source as CitedSource;
      // Deleted document: the panel shows only the excerpt
      if (documentId === null) return null;
      return (
        <OriginalFile
          key={`${documentId}-${page}`}
          title={source.title}
          documentId={documentId}
          page={page}
          loadFile={loadFile}
          {...view}
        />
      );
    },
    [loadFile],
  );

  const panel = reference && (
    <ReferencePanel
      sources={reference.sources}
      activeId={reference.activeId}
      highlights={reference.highlights}
      onSelect={(id) => setReference({ ...reference, activeId: id })}
      onClose={closeReference}
      renderOriginal={renderOriginal}
      popOut
    />
  );

  let greeting = (
    <Greeting prompt="What would you like to ask about your documents?" />
  );
  if (saved.state === 'loading') {
    greeting = (
      <p role="status" className="text-center text-ink-soft">
        Loading this answer…
      </p>
    );
  } else if (saved.state === 'failed') {
    greeting = <SavedAnswerError error={saved.error} onRetry={retry} />;
  }

  return (
    <BrandingProvider value={branding}>
      <CitationsProvider value={openReference}>
        {(messages.length > 0 || answerId !== null) && (
          <TopBarActions>
            <Button size="sm" onClick={startNewChat}>
              New chat
            </Button>
          </TopBarActions>
        )}

        {/* Keep the message box in view while the conversation scrolls. */}
        <div className="flex h-full min-h-0">
          <div className="flex min-w-0 flex-1 flex-col">
            <Conversation
              greeting={greeting}
              disclaimer={branding.disclaimer}
              messages={messages}
              busy={chat.busy}
              // Send the next question right away, even after the user clicks Stop.
              onSubmit={chat.sendNow}
              onSendNow={chat.sendNow}
              onStop={chat.stop}
              onRetry={chat.retry}
              features={{ queue: false, suggestions: false }}
              suggestions={[]}
              queue={chat.queue}
              held={chat.held}
              chain={chat.chain}
              onSendQueuedNow={chat.sendQueuedNow}
              onEditQueued={chat.editQueued}
              onMoveQueued={chat.moveQueued}
              onRemoveQueued={chat.removeQueued}
              onHold={chat.hold}
              onResume={chat.resume}
              onClearQueue={chat.clearQueue}
              showActions={false}
            />
          </div>

          {panel && wide && (
            <ResizableColumn
              initial={420}
              storageKey="chat-reference-width"
              minWidth={320}
              minRemainder={420}
              aria-label="Resize sources panel"
              className="flex flex-col border-l border-line"
            >
              {panel}
            </ResizableColumn>
          )}
        </div>

        {panel && !wide && (
          <SlideOver
            open
            onClose={closeReference}
            label="Sources"
            side="right"
            position="fixed"
            className="flex w-[min(26rem,100vw)] flex-col bg-panel-solid"
          >
            {panel}
          </SlideOver>
        )}
      </CitationsProvider>
    </BrandingProvider>
  );
});

function SavedAnswerError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  if (error instanceof ApiError && error.status === 404) {
    return (
      <Notice tone="error">
        This answer isn't in your history. Pick another one or start a new chat.
      </Notice>
    );
  }
  const message =
    error instanceof ApiError && error.status === 0
      ? error.message
      : "Couldn't load this answer.";
  return (
    <Notice tone="error" action={{ label: 'Retry', onClick: onRetry }}>
      {message}
    </Notice>
  );
}
