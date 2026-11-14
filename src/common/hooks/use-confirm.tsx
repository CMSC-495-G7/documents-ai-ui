import { Button, Modal } from '@radixp0int/ai-chat-kit';
import { useCallback, useState } from 'react';

export type ConfirmOptions = {
  title: string;
  message?: string;
  // Red Yes button, for things like delete
  danger?: boolean;
};

type Request = ConfirmOptions & { resolve: (yes: boolean) => void };

// Asks a Yes/No question in a modal.
// const { confirm, confirmDialog } = useConfirm();
// if (await confirm({ title: 'Delete it?' })) { ... }
// Render {confirmDialog} somewhere in the component.
export function useConfirm() {
  const [request, setRequest] = useState<Request | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    [],
  );

  function answer(yes: boolean) {
    request?.resolve(yes);
    setRequest(null);
  }

  const confirmDialog = (
    <Modal
      open={request !== null}
      // Escape, the X and clicking outside all count as No
      onOpenChange={(open) => {
        if (!open) answer(false);
      }}
      size="sm"
      title={request?.title ?? ''}
      description={request?.message}
      footer={
        <>
          <Button onClick={() => answer(false)}>No</Button>
          <Button
            variant={request?.danger ? 'destructive' : 'primary'}
            onClick={() => answer(true)}
          >
            Yes
          </Button>
        </>
      }
    />
  );

  return { confirm, confirmDialog };
}
