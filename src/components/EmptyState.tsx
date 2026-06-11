import { Button } from '@/components/ui/Button';

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-card border-[1.5px] border-dashed border-line px-5 py-[70px] text-center text-muted">
      <h3 className="my-2 text-text">No team members yet</h3>
      <p>
        Add your teammates to see everyone&apos;s local time and availability at
        a glance.
      </p>
      <Button variant="primary" className="mt-3" onClick={onAdd}>
        + Add your first member
      </Button>
    </div>
  );
}
