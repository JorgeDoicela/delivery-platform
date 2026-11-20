import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type AlertBannerVariant = "success" | "error" | "warning" | "info";

export interface AlertBannerProps {
  variant?: AlertBannerVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const variantStyles: Record<
  AlertBannerVariant,
  {
    container: string;
    iconWrapper: string;
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    titleClass: string;
    textClass: string;
    closeClass: string;
  }
> = {
  success: {
    container:
      "bg-emerald-50/95 dark:bg-emerald-950/25 border-emerald-200/90 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-100 shadow-xs",
    iconWrapper: "bg-emerald-100/90 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
    iconClass: "w-4 h-4 text-emerald-700 dark:text-emerald-400",
    titleClass: "text-emerald-900 dark:text-emerald-200 font-bold",
    textClass: "text-emerald-800/90 dark:text-emerald-300/90",
    closeClass: "text-emerald-700 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-100",
  },
  error: {
    container:
      "bg-red-50/95 dark:bg-red-950/25 border-red-200/90 dark:border-red-800/50 text-red-950 dark:text-red-100 shadow-xs",
    iconWrapper: "bg-red-100/90 dark:bg-red-900/50 text-red-600 dark:text-red-400",
    icon: AlertCircle,
    iconClass: "w-4 h-4 text-red-600 dark:text-red-400",
    titleClass: "text-red-900 dark:text-red-200 font-bold",
    textClass: "text-red-800/90 dark:text-red-300/90",
    closeClass: "text-red-700 hover:text-red-950 dark:text-red-400 dark:hover:text-red-100",
  },
  warning: {
    container:
      "bg-amber-50/95 dark:bg-amber-950/25 border-amber-200/90 dark:border-amber-800/50 text-amber-950 dark:text-amber-100 shadow-xs",
    iconWrapper: "bg-amber-100/90 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400",
    icon: AlertTriangle,
    iconClass: "w-4 h-4 text-amber-700 dark:text-amber-400",
    titleClass: "text-amber-900 dark:text-amber-200 font-bold",
    textClass: "text-amber-800/90 dark:text-amber-300/90",
    closeClass: "text-amber-700 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-100",
  },
  info: {
    container:
      "bg-sky-50/95 dark:bg-sky-950/25 border-sky-200/90 dark:border-sky-800/50 text-sky-950 dark:text-sky-100 shadow-xs",
    iconWrapper: "bg-sky-100/90 dark:bg-sky-900/50 text-sky-700 dark:text-sky-400",
    icon: Info,
    iconClass: "w-4 h-4 text-sky-700 dark:text-sky-400",
    titleClass: "text-sky-900 dark:text-sky-200 font-bold",
    textClass: "text-sky-800/90 dark:text-sky-300/90",
    closeClass: "text-sky-700 hover:text-sky-950 dark:text-sky-400 dark:hover:text-sky-100",
  },
};

export function AlertBanner({
  variant = "info",
  title,
  children,
  className = "",
  onClose,
}: AlertBannerProps) {
  const styles = variantStyles[variant];
  const IconComponent = styles.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border transition-colors duration-150 ${styles.container} ${className}`}
    >
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${styles.iconWrapper}`}
        aria-hidden="true"
      >
        <IconComponent className={styles.iconClass} />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5 pt-0.5">
        {title && (
          <h4 className={`text-xs font-display uppercase tracking-wide ${styles.titleClass}`}>
            {title}
          </h4>
        )}
        <div className={`text-xs leading-relaxed ${styles.textClass}`}>
          {children}
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${styles.closeClass}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
