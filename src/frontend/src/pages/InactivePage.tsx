import { Button } from "@/components/ui/button";
import { BarChart3, LogOut, ShieldX } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function InactivePage() {
  const { clear } = useInternetIdentity();

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
            style={{ background: "oklch(0.97 0.02 27)" }}
          >
            <ShieldX
              className="w-8 h-8"
              style={{ color: "oklch(0.58 0.22 27)" }}
            />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-xl font-bold text-foreground">
              Account Inactive
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account has been deactivated. You no longer have access to
              Corporate Performance.
            </p>
          </div>

          <div
            className="rounded-xl border p-4 text-left"
            style={{
              background: "oklch(0.97 0.012 27)",
              borderColor: "oklch(0.88 0.04 27)",
            }}
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you believe this is an error or need your account reactivated,
              please contact your{" "}
              <strong className="text-foreground">Company Admin</strong>{" "}
              directly.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={clear} className="gap-2">
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
