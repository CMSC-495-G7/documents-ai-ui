import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { history } from '../../../testing/chat-fixtures.ts';
import { AnswerHistory } from './answer-history.tsx';

function renderHistory(
  props: Partial<Parameters<typeof AnswerHistory>[0]> = {},
) {
  const onRetry = vi.fn();
  render(
    <AnswerHistory
      items={history}
      failed={false}
      activeId={null}
      onRetry={onRetry}
      {...props}
    />,
  );
  return onRetry;
}

function rows() {
  return within(
    screen.getByRole('list', { name: 'Recent questions' }),
  ).getAllByRole('link');
}

describe('AnswerHistory', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('lists the questions newest first, each linking to its answer', () => {
    renderHistory();

    expect(rows().map((row) => row.textContent)).toEqual([
      expect.stringContaining('Can I work from home?'),
      expect.stringContaining('When is payday?'),
    ]);
    expect(rows()[0]).toHaveAttribute('href', '/chat/5');
    expect(rows()[1]).toHaveAttribute('href', '/chat/4');
  });

  it('shows when each question was asked', () => {
    vi.useFakeTimers({ now: new Date('2026-11-16T18:00:00Z') });
    renderHistory();

    expect(rows()[0]).toHaveTextContent('Today');
    expect(rows()[1]).toHaveTextContent('Nov 2');
  });

  it('marks the open answer', () => {
    renderHistory({ activeId: 4 });

    expect(rows()[1]).toHaveAttribute('aria-current', 'page');
    expect(rows()[0]).not.toHaveAttribute('aria-current');
  });

  it('says it is loading', () => {
    renderHistory({ items: null });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading your questions…',
    );
  });

  it('says where questions will show up when there are none', () => {
    renderHistory({ items: [] });

    expect(
      screen.getByText('Questions you ask show up here.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('shows an error with Retry when the list fails', async () => {
    const onRetry = renderHistory({ items: null, failed: true });

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't load your questions.",
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('keeps the list if a refresh fails', () => {
    renderHistory({ failed: true });

    expect(rows()).toHaveLength(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
