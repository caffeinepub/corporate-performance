import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Building2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useCreateCompany } from "../../hooks/useQueries";

export default function OnboardCompany() {
  const navigate = useNavigate();
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const createCompany = useCreateCompany();

  const [companyName, setCompanyName] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = "Company name is required.";
    if (!adminFullName.trim())
      errs.adminFullName = "Your full name is required.";
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
      await createCompany.mutateAsync({
        companyName: companyName.trim(),
        adminFullName: adminFullName.trim(),
        email: email.trim() || null,
      });
      toast.success("Company created successfully!");
      void navigate({ to: "/admin" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create company.";
      toast.error(message);
    }
  };

  if (!identity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-6">
          <div
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center"
            style={{ background: "oklch(0.26 0.065 258)" }}
          >
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-xl">
              Authentication required
            </h2>
            <p className="text-sm text-muted-foreground">
              Please sign in with Internet Identity before creating a company.
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
            <Building2
              className="w-8 h-8"
              style={{ color: "oklch(0.82 0.14 72)" }}
            />
          </div>
          <div className="space-y-3">
            <h2
              className="font-display text-3xl font-bold"
              style={{ color: "oklch(0.95 0.006 252)" }}
            >
              New company setup
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "oklch(0.62 0.022 258)" }}
            >
              You'll be the Company Admin — responsible for managing users,
              organizational structure, and KPI governance.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            {[
              "Create the org structure",
              "Invite employees via registration codes",
              "Manage KPI & OKR years",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "oklch(0.82 0.14 72)" }}
                />
                <span
                  className="text-sm"
                  style={{ color: "oklch(0.68 0.022 258)" }}
                >
                  {item}
                </span>
              </div>
            ))}
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
              Create your company
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your organization on Corporate Performance.
            </p>
          </div>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-5"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-sm font-medium">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="e.g. Acme Corporation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                aria-describedby={
                  errors.companyName ? "companyName-error" : undefined
                }
                className={errors.companyName ? "border-destructive" : ""}
                autoComplete="organization"
              />
              {errors.companyName && (
                <p
                  id="companyName-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {errors.companyName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminFullName" className="text-sm font-medium">
                Your Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="adminFullName"
                placeholder="e.g. Sarah Johnson"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                aria-describedby={
                  errors.adminFullName ? "adminFullName-error" : undefined
                }
                className={errors.adminFullName ? "border-destructive" : ""}
                autoComplete="name"
              />
              {errors.adminFullName && (
                <p
                  id="adminFullName-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {errors.adminFullName}
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
              disabled={createCompany.isPending}
            >
              {createCompany.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating company…
                </>
              ) : (
                "Create Company & Continue"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
