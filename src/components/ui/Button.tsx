import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

export function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-app-primary text-white hover:bg-[#0a6955]",
    secondary: "border border-app-border bg-white text-app-text hover:bg-app-muted",
    danger: "bg-app-danger text-white hover:bg-[#a83225]",
    ghost: "text-app-subtle hover:bg-app-muted"
  };

  return (
    <button
      className={`h-11 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
