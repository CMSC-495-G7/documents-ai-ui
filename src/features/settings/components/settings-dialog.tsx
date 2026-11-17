import { Modal } from '@radixp0int/ai-chat-kit';
import { AnswerProviderSettings } from './answer-provider-settings.tsx';

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

// Admins only. Becomes a full config page later.
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Settings"
      description="These apply to everyone in your workspace."
    >
      {/* Only while open, so it loads fresh every time */}
      {open && <AnswerProviderSettings />}
    </Modal>
  );
}
