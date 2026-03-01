import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  ChevronRight,
  Key,
  Loader2,
  LogIn,
} from "lucide-react";
import { type Variants, motion } from "motion/react";
import { useEffect } from "react";
import {
  Variant_DivisionHead_Director_PresidentDirector_DepartmentHead_CompanyAdmin,
  Variant_Inactive_Active_Unassigned,
} from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useMyProfile } from "../../hooks/useQueries";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function OnboardLanding() {
  const navigate = useNavigate();
  const { identity, login, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const { isFetching: isActorFetching } = useActor();
  const { data: profile, isLoading: isProfileLoading } = useMyProfile();

  const isAuthenticated = !!identity;

  // Redirect authenticated users who already have a profile
  useEffect(() => {
    if (!identity) return;
    if (isActorFetching || isProfileLoading) return;
    if (!profile) return;

    if (profile.status === Variant_Inactive_Active_Unassigned.Unassigned) {
      void navigate({ to: "/pending" });
      return;
    }

    if (profile.status === Variant_Inactive_Active_Unassigned.Inactive) {
      void navigate({ to: "/inactive" });
      return;
    }

    if (profile.status === Variant_Inactive_Active_Unassigned.Active) {
      const isAdmin = profile.roles.some(
        (r) =>
          r.roleType ===
          Variant_DivisionHead_Director_PresidentDirector_DepartmentHead_CompanyAdmin.CompanyAdmin,
      );
      void navigate({ to: isAdmin ? "/admin" : "/workspace" });
    }
  }, [identity, isActorFetching, isProfileLoading, profile, navigate]);

  // Show a loading spinner while checking the profile for authenticated users
  const isCheckingProfile =
    isAuthenticated && (isActorFetching || isProfileLoading);

  // Show two-option UI only when authenticated AND confirmed no profile
  const showOptions =
    isAuthenticated && !isActorFetching && !isProfileLoading && !profile;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12"
        style={{
          background: "oklch(0.22 0.058 258)",
        }}
      >
        <div>
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
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants}>
            <h1
              className="font-display text-4xl font-bold leading-tight"
              style={{ color: "oklch(0.95 0.006 252)" }}
            >
              Drive performance.
              <br />
              <span style={{ color: "oklch(0.82 0.14 72)" }}>
                Align your teams.
              </span>
            </h1>
          </motion.div>
          <motion.p
            variants={itemVariants}
            className="text-base leading-relaxed"
            style={{ color: "oklch(0.68 0.025 258)" }}
          >
            A unified platform for KPI management, strategic alignment, and
            organizational performance reporting — built on the Internet
            Computer.
          </motion.p>

          <motion.div variants={itemVariants} className="space-y-3 pt-2">
            {[
              "Balanced Scorecard framework",
              "Hierarchical approval workflows",
              "Real-time progress tracking",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "oklch(0.82 0.14 72)" }}
                />
                <span
                  className="text-sm"
                  style={{ color: "oklch(0.72 0.022 258)" }}
                >
                  {feat}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

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

      {/* Right panel — actions */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.26 0.065 258)" }}
          >
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base">
            Corporate Performance
          </span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md space-y-8"
        >
          <motion.div variants={itemVariants} className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {showOptions ? "Get started" : "Welcome"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {showOptions
                ? "How would you like to proceed?"
                : "Sign in with Internet Identity to continue."}
            </p>
          </motion.div>

          {isCheckingProfile ? (
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-border" />
                <Loader2
                  className="w-12 h-12 absolute inset-0 animate-spin text-primary"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Checking your account…
              </p>
            </motion.div>
          ) : !isAuthenticated ? (
            <motion.div variants={itemVariants}>
              <Button
                size="lg"
                className="w-full gap-3 font-semibold text-sm"
                style={{ background: "oklch(0.26 0.065 258)" }}
                onClick={login}
                disabled={isLoggingIn || isInitializing}
              >
                {isLoggingIn ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Login with Internet Identity
                  </>
                )}
              </Button>
              <p className="mt-4 text-xs text-center text-muted-foreground">
                Internet Identity is the secure, passwordless authentication
                system of the Internet Computer.
              </p>
            </motion.div>
          ) : showOptions ? (
            <motion.div variants={itemVariants} className="space-y-4">
              {/* Option A */}
              <button
                type="button"
                onClick={() => void navigate({ to: "/onboard/company" })}
                className="w-full group rounded-xl border-2 border-border bg-card p-5 text-left transition-all duration-200 hover:border-primary hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="mt-0.5 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:opacity-90"
                    style={{ background: "oklch(0.26 0.065 258)" }}
                  >
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-semibold text-sm text-foreground">
                        Create a New Company
                      </h3>
                      <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Set up your organization and become the Company Admin.
                      You'll manage users, structure, and KPI governance.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option B */}
              <button
                type="button"
                onClick={() => void navigate({ to: "/onboard/join" })}
                className="w-full group rounded-xl border-2 border-border bg-card p-5 text-left transition-all duration-200 hover:border-primary hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="mt-0.5 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:opacity-90"
                    style={{ background: "oklch(0.82 0.14 72)" }}
                  >
                    <Key
                      className="w-5 h-5"
                      style={{ color: "oklch(0.12 0.025 258)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-semibold text-sm text-foreground">
                        Join with a Registration Code
                      </h3>
                      <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Your Company Admin has shared a registration code with
                      you. Use it to join your organization.
                    </p>
                  </div>
                </div>
              </button>
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
