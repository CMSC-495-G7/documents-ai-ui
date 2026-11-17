import {
  Button,
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
  type Source,
} from '@radixp0int/ai-chat-kit/chat';
import { useState } from 'react';
import { TopBarActions } from '../../../common/top-bar/top-bar-slot.tsx';
import { askResponder } from '../utils/ask-responder.ts';

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

// This page starts with an empty chat each time it opens.
export function ChatPage() {
  const chat = useChat(askResponder);
  const [reference, setReference] = useState<OpenReference | null>(null);
  const wide = useMediaQuery('(min-width: 64rem)', true);

  const openReference: CiteHandler = (sources, activeId, highlights) =>
    setReference({ sources, activeId, highlights });

  function closeReference() {
    setReference(null);
  }

  function startNewChat() {
    chat.reset();
    closeReference();
  }

  const panel = reference && (
    <ReferencePanel
      sources={reference.sources}
      activeId={reference.activeId}
      highlights={reference.highlights}
      onSelect={(id) => setReference({ ...reference, activeId: id })}
      onClose={closeReference}
    />
  );

  return (
    <BrandingProvider value={branding}>
      <CitationsProvider value={openReference}>
        {chat.messages.length > 0 && (
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
              greeting={
                <Greeting prompt="What would you like to ask about your documents?" />
              }
              disclaimer={branding.disclaimer}
              messages={chat.messages}
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
}
