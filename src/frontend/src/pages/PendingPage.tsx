import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BarChart3, Clock, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function PendingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clear } = useInternetIdentity();

  const handleSignOut = () => {
    queryClient.clear();
    void navigate({ to: "/onboard" });
    clear();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.26 0.065 258)" }}
          >
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-sm text-foreground">
            Corporate Performance
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-8 text-center space-y-6">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "oklch(0.94 0.012 252)" }}
          >
            <Clock
              className="w-8 h-8"
              style={{ color: "oklch(0.52 0.065 258)" }}
            />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-xl font-bold text-foreground">
              Awaiting Role Assignment
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You've successfully joined your company. Your account is pending
              role assignment by a Company Admin.
            </p>
          </div>

          <div
            className="rounded-xl p-4 text-left space-y-2"
            style={{ background: "oklch(0.96 0.008 252)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What to do now
            </p>
            <ul className="space-y-1.5">
              {[
                "Contact your Company Admin",
                "Ask them to assign you a role",
                "Return here once assigned",
              ].map((step) => (
                <li
                  key={step}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "oklch(0.52 0.065 258)" }}
                  />
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>

        <p className="mt-8 text-xs text-center text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
