import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { isTodo } from '../i18n';

type Variant = 'primary' | 'secondary' | 'stop' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-calm text-white hover:bg-[#225a50] border-2 border-calm',
  secondary: 'bg-white text-ink border-2 border-ink hover:bg-[#f0ebe0]',
  stop: 'bg-stop text-white border-2 border-white shadow-lg hover:bg-[#931f18]',
  ghost: 'bg-transparent text-ink border-2 border-transparent hover:border-ink',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }
>(function Button({ variant = 'primary', block, className = '', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`min-h-tap min-w-tap rounded-xl px-5 py-3 text-lg font-semibold transition-colors disabled:opacity-50 ${
        variants[variant]
      } ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
});

/** Accessible on/off switch. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span id={`${id}-label`} className="block font-semibold">
          {label}
        </span>
        {description && (
          <span id={`${id}-desc`} className="block text-sm text-muted">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-9 w-16 shrink-0 rounded-full border-2 border-ink transition-colors disabled:opacity-60 ${
          checked ? 'bg-calm' : 'bg-white'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-ink transition-all ${
            checked ? 'left-[calc(100%-1.75rem)] bg-white' : 'left-1 bg-ink'
          }`}
        />
      </button>
    </div>
  );
}

/** Renders a translated string; TODO placeholders get a visible dashed marker. */
export function Txt({ children, as: As = 'span', className = '' }: { children: string; as?: 'span' | 'p' | 'li' | 'blockquote'; className?: string }) {
  if (isTodo(children)) {
    return (
      <As className={`rounded border-2 border-dashed border-[#b06d00] bg-[#fff4d6] px-2 py-1 text-[#5c3900] ${className}`}>
        {children}
      </As>
    );
  }
  return <As className={className}>{children}</As>;
}

/** Page heading that receives focus when the screen changes (keyboard + screen reader users). */
export function ScreenHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1} className={`text-3xl font-bold leading-tight outline-none ${className}`}>
      {children}
    </h1>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border-2 border-ink/15 bg-white p-5 ${className}`}>{children}</section>;
}
