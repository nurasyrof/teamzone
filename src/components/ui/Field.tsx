import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const controlCls =
  'w-full rounded-[10px] border border-line bg-panel2 px-3 py-[10px] text-sm outline-none focus:border-accent';

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-[6px] block text-xs font-bold uppercase tracking-[0.5px] text-muted">
        {label}
      </label>
      {children}
      {hint && <div className="mt-[5px] text-[11.5px] text-muted">{hint}</div>}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(controlCls, className)} {...rest} />;
  },
);

export const SelectInput = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function SelectInput({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn(controlCls, className)} {...rest}>
      {children}
    </select>
  );
});
