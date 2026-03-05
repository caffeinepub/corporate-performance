import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Key, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useJoinCompany } from "../../hooks/useQueries";

export default function OnboardJoin() {
  const navigate = useNavigate();
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const joinCompany = useJoinCompany();

  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = "Registration code is required.";
    if (!fullName.trim()) errs.fullName = "Your full name is required.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      await joinCompany.mutateAsync({
        code: code.trim(),
        fullName: fullName.trim(),
        email: email.trim() || null,
      });
      toast.success("Successfully joined! Awaiting role assignment.");
      // Navigation is handled by RootGate once the profile re-fetches.
      // Do NOT call navigate() here — it conflicts with RootGate's <Navigate>
      // during the same render cycle and causes React error #301.
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const alreadyRegistered =
        raw.toLowerCase().includes("already registered in a company") ||
        raw.toLowerCase().includes("principal already registered");
      const invalidCode =
        raw.toLowerCase().includes("invalid registration code") ||
        raw.toLowerCase().includes("code not found") ||
        raw.toLowerCase().includes("code already used") ||
        raw.toLowerCase().includes("inactive");

      if (alreadyRegistered) {
        toast.error(
          "This Internet Identity is already registered in a company. Please sign in to access your existing account.",
          {
            duration: 8000,
            action: {
              label: "Go to login",
              onClick: () => void navigate({ to: "/onboard" }),
            },
          },
        );
      } else if (invalidCode) {
        toast.error(
          "This registration code is invalid or has already been used. Please ask your Company Admin for a new code.",
          { duration: 6000 },
        );
      } else {
        toast.error(raw || "Failed to join company.");
      }
    }
  };

  if (!identity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-6">
          <div
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center"
            style={{ background: "oklch(0.82 0.14 72)" }}
          >
            <Key
              className="w-6 h-6"
              style={{ color: "oklch(0.12 0.025 258)" }}
            />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-xl">
              Authentication required
            </h2>
            <p className="text-sm text-muted-foreground">
              Please sign in with Internet Identity before joining a company.
            </p>
          </div>
          <Button className="w-full" onClick={login} disabled={isLoggingIn}>
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Login with Internet Identity
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate({ to: "/onboard" })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand strip */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12"
        style={{ background: "oklch(0.22 0.058 258)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.82 0.14 72)" }}
          >
            <BarChart3
              className="w-5 h-5"
              style={{ color: "oklch(0.12 0.025 258)" }}
            />
          </div>
          <span
            className="font-display font-bold text-lg"
            style={{ color: "oklch(0.92 0.01 258)" }}
          >
            Corporate Performance
          </span>
        </div>

        <div className="space-y-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "oklch(0.30 0.065 258)" }}
          >
            <Key className="w-8 h-8" style={{ color: "oklch(0.82 0.14 72)" }} />
          </div>
          <div className="space-y-3">
            <h2
              className="font-display text-3xl font-bold"
              style={{ color: "oklch(0.95 0.006 252)" }}
            >
              Join your company
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "oklch(0.62 0.022 258)" }}
            >
              Your Company Admin has generated a unique registration code for
              you. Enter it below to join your organization.
            </p>
          </div>
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: "oklch(0.30 0.065 258)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "oklch(0.82 0.14 72)" }}
            >
              What happens next?
            </p>
            <ul className="space-y-1.5">
              {[
                "Your profile is created",
                "You're linked to the company",
                "Admin assigns your role",
                "You gain access to your workspace",
              ].map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "oklch(0.72 0.022 258)" }}
                >
                  <span
                    className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0"
                    style={{
                      background: "oklch(0.38 0.065 258)",
                      color: "oklch(0.82 0.14 72)",
                    }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-xs" style={{ color: "oklch(0.45 0.018 258)" }}>
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "oklch(0.62 0.022 258)" }}
            className="hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          <div>
            <button
              type="button"
              onClick={() => void navigate({ to: "/onboard" })}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to options
            </button>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Join an existing company
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the registration code provided by your Company Admin.
            </p>
          </div>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-5"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-sm font-medium">
                Registration Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="e.g. ABC-123-XYZ"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                aria-describedby={errors.code ? "code-error" : undefined}
                className={`font-mono tracking-wider ${errors.code ? "border-destructive" : ""}`}
                autoComplete="off"
                autoCapitalize="characters"
              />
              {errors.code && (
                <p
                  id="code-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {errors.code}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Registration codes are single-use and provided by your Company
                Admin.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Your Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="e.g. John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-describedby={
                  errors.fullName ? "fullName-error" : undefined
                }
                className={errors.fullName ? "border-destructive" : ""}
                autoComplete="name"
              />
              {errors.fullName && (
                <p
                  id="fullName-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold"
              style={{ background: "oklch(0.26 0.065 258)" }}
              disabled={joinCompany.isPending}
            >
              {joinCompany.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining company…
                </>
              ) : (
                "Join Company"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
