import type { KeyboardEvent } from "react";

/** Horizontal automatic-activation tabs with a single keyboard tab stop. */
export function TabStrip<T extends string>({
  label,
  className,
  choices,
  value,
  onChange,
}: {
  label: string;
  className: string;
  choices: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (current + 1) % choices.length;
        break;
      case "ArrowLeft":
        next = (current + choices.length - 1) % choices.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = choices.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    onChange(choices[next].value);
    buttons[next].focus();
  };
  return (
    <div
      className={className}
      role="tablist"
      aria-label={label}
      onKeyDown={navigate}
    >
      {choices.map((choice) => (
        <button
          key={choice.value}
          role="tab"
          aria-selected={value === choice.value}
          tabIndex={value === choice.value ? 0 : -1}
          onClick={() => onChange(choice.value)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
