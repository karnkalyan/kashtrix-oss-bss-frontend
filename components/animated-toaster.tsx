"use client";

import React from "react";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";

export function AnimatedToaster() {
  return (
    <Toaster
      position="top-right"
      containerClassName="kashtrix-toast-container"
      gutter={10}
      toastOptions={{
        duration: 4000,
        className: "kashtrix-animated-toast",
      }}
    >
      {(t) => {
        const durationMs = t.duration || 4000;
        const isInfinite = durationMs === Infinity;

        // Determine icon based on toast type
        let IconComponent = Info;
        let iconColor = "text-sky-400";
        let barColor = "bg-sky-500";
        let borderColor = "border-sky-500/30";

        if (t.type === "success") {
          IconComponent = CheckCircle2;
          iconColor = "text-emerald-400";
          barColor = "bg-emerald-500";
          borderColor = "border-emerald-500/30";
        } else if (t.type === "error") {
          IconComponent = AlertCircle;
          iconColor = "text-rose-400";
          barColor = "bg-rose-500";
          borderColor = "border-rose-500/30";
        } else if (t.type === "loading") {
          IconComponent = Loader2;
          iconColor = "text-violet-400";
          barColor = "bg-violet-500";
          borderColor = "border-violet-500/30";
        }

        return (
          <div
            className={`relative flex items-center gap-3 overflow-hidden rounded-xl border ${borderColor} px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300 ${
              t.visible ? "animate-toast-enter opacity-100 scale-100" : "animate-toast-leave opacity-0 scale-95"
            }`}
            style={{
              background: "var(--theme-card, rgba(18, 21, 25, 0.95))",
              color: "var(--theme-card-foreground, #E7EAED)",
              minWidth: "300px",
              maxWidth: "440px",
            }}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <IconComponent className={`h-5 w-5 ${iconColor} ${t.type === "loading" ? "animate-spin" : ""}`} />
            </div>

            {/* Message Body */}
            <div className="flex-1 text-sm font-medium leading-snug">
              {typeof t.message === "function" ? t.message(t) : t.message}
            </div>

            {/* Dismiss Button */}
            {t.type !== "loading" && (
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="flex-shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Animated countdown progress timer bar */}
            {!isInfinite && t.type !== "loading" && (
              <div
                className={`absolute bottom-0 left-0 h-[3px] ${barColor} animate-toast-progress`}
                style={{
                  animationDuration: `${durationMs}ms`,
                  animationPlayState: t.visible ? "running" : "paused",
                }}
              />
            )}
          </div>
        );
      }}
    </Toaster>
  );
}
