import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useConfirm } from './use-confirm.tsx';

function Asker({ onAnswer }: { onAnswer: (yes: boolean) => void }) {
  const { confirm, confirmDialog } = useConfirm();
  return (
    <>
      {confirmDialog}
      <button
        type="button"
        onClick={async () =>
          onAnswer(await confirm({ title: 'Delete it?', message: 'No undo.' }))
        }
      >
        Ask
      </button>
    </>
  );
}

async function ask() {
  const onAnswer = vi.fn();
  render(<Asker onAnswer={onAnswer} />);
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
  return onAnswer;
}

describe('useConfirm', () => {
  it('is closed until something asks', () => {
    render(<Asker onAnswer={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the title and message', async () => {
    await ask();
    const dialog = screen.getByRole('dialog', { name: 'Delete it?' });
    expect(dialog).toHaveAccessibleDescription('No undo.');
  });

  it('answers true for Yes and closes', async () => {
    const onAnswer = await ask();
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('answers false for No and closes', async () => {
    const onAnswer = await ask();
    await userEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('answers false when closed with Escape', async () => {
    const onAnswer = await ask();
    // What the browser fires for Escape
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    );
    await vi.waitFor(() =>
      expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false),
    );
  });
});
