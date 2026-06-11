import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'default' | 'primary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  'inline-flex items-center gap-[7px] rounded-[10px] px-[14px] py-2 text-[13px] font-semibold transition-[0.15s] disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  default:
    'border border-line bg-panel text-text hover:border-accent hover:bg-panel2',
  primary:
    'border border-transparent bg-accent text-ink hover:brightness-110',
  ghost:
    'border border-line bg-transparent text-text hover:border-accent hover:bg-panel2',
  danger:
    'border border-red/40 bg-transparent text-red hover:bg-red/10',
};

export function Button({ variant = 'default', className, ...rest }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...rest} />;
}

/** Small square icon button (e.g. edit pencil on a card). */
export function IconButton({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'grid h-7 w-7 place-items-center rounded-lg border border-line bg-black/25 text-[13px] text-muted transition-[0.15s] hover:border-accent hover:text-text',
        className,
      )}
      {...rest}
    />
  );
}
