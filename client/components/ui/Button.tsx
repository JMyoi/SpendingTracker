interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  fullWidth?: boolean;
  variant?: "primary" | "outline" | "ghost";
  disabled?: boolean;
}

export default function Button({
  children,
  type = "button",
  onClick,
  fullWidth = false,
  variant = "primary",
  disabled = false,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary: "bg-amber-500 hover:bg-amber-600 text-white",
    outline: "border border-stone-300 text-stone-700 hover:bg-stone-100",
    ghost: "text-stone-600 hover:text-stone-900 hover:bg-stone-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}
