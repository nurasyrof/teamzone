import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'default' | 'primary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  'inline-flex items-center gap-[7px] px-[14px] py-2 text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  default: 'border border-line bg-panel text-text hover:bg-panel2',
  primary: 'border border-accent bg-accent text-white hover:brightness-95',
  ghost: 'border border-line bg-panel text-text hover:bg-panel2',
  danger: 'border border-red/40 bg-panel text-red hover:bg-red/5',
};

export function Button({ variant = 'default', className, ...rest }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...rest} />;
}

/** Small square icon button (e.g. edit pencil on a card). */
export function IconButton({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'grid h-7 w-7 place-items-center border border-line bg-panel text-[13px] text-muted transition-colors hover:border-accent hover:text-accent',
        className,
      )}
      {...rest}
    />
  );
}
