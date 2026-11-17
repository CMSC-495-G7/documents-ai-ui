import { MenuPanelLabel, MenuPanelRow, Notice } from '@radixp0int/ai-chat-kit';
import { paths } from '../../../common/config/paths.ts';
import type { HistoryItem } from '../types.ts';
import { whenLabel } from '../utils/when-label.ts';

type AnswerHistoryProps = {
  // null while it's loading
  items: HistoryItem[] | null;
  failed: boolean;
  // The answer that's open, if any
  activeId: number | null;
  onRetry: () => void;
};

// The user's recent questions, drawn in the side menu's Chat panel
export function AnswerHistory({
  items,
  failed,
  activeId,
  onRetry,
}: AnswerHistoryProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <MenuPanelLabel>Recent questions</MenuPanelLabel>
      <HistoryBody
        items={items}
        failed={failed}
        activeId={activeId}
        onRetry={onRetry}
      />
    </div>
  );
}

function HistoryBody({ items, failed, activeId, onRetry }: AnswerHistoryProps) {
  if (items === null && failed) {
    return (
      <Notice tone="error" action={{ label: 'Retry', onClick: onRetry }}>
        Couldn't load your questions.
      </Notice>
    );
  }
  if (items === null) {
    return (
      <p role="status" className="px-2 py-1.5 text-sm text-ink-soft">
        Loading your questions…
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <p className="px-2 py-1.5 text-sm text-ink-soft">
        Questions you ask show up here.
      </p>
    );
  }
  return (
    <ul aria-label="Recent questions" className="flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={item.id}>
          <MenuPanelRow
            href={`${paths.chat}/${item.id}`}
            name={item.question}
            sub={whenLabel(item.created_at)}
            current={item.id === activeId}
          />
        </li>
      ))}
    </ul>
  );
}
