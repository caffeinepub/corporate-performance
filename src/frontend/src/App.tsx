import { Toaster } from "@/components/ui/sonner";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useMyProfile } from "./hooks/useQueries";

import InactivePage from "./pages/InactivePage";
import PendingPage from "./pages/PendingPage";
import AdminLayout from "./pages/admin/AdminLayout";
import OnboardCompany from "./pages/onboard/OnboardCompany";
import OnboardJoin from "./pages/onboard/OnboardJoin";
// Page imports
import OnboardLanding from "./pages/onboard/OnboardLanding";
import WorkspaceLayout from "./pages/workspace/WorkspaceLayout";

import AdminBSCAspects from "./pages/admin/stubs/AdminBSCAspects";
// Admin stub pages
import AdminCompanySetup from "./pages/admin/stubs/AdminCompanySetup";
import AdminKPIOKRYears from "./pages/admin/stubs/AdminKPIOKRYears";
import AdminKPIView from "./pages/admin/stubs/AdminKPIView";
import AdminOKRView from "./pages/admin/stubs/AdminOKRView";
import AdminOrgStructure from "./pages/admin/stubs/AdminOrgStructure";
import AdminRegistrationCodes from "./pages/admin/stubs/AdminRegistrationCodes";
import AdminRoleAssignment from "./pages/admin/stubs/AdminRoleAssignment";
import AdminStrategicObjectives from "./pages/admin/stubs/AdminStrategicObjectives";
import AdminUsers from "./pages/admin/stubs/AdminUsers";

import WorkspaceKPIApproval from "./pages/workspace/stubs/WorkspaceKPIApproval";
import WorkspaceKPIProgress from "./pages/workspace/stubs/WorkspaceKPIProgress";
// Workspace stub pages
import WorkspaceKPIProposal from "./pages/workspace/stubs/WorkspaceKPIProposal";
import WorkspaceOKRApproval from "./pages/workspace/stubs/WorkspaceOKRApproval";
import WorkspaceOKRProgress from "./pages/workspace/stubs/WorkspaceOKRProgress";
import WorkspaceOKRProposal from "./pages/workspace/stubs/WorkspaceOKRProposal";
import WorkspaceSubKPIProgress from "./pages/workspace/stubs/WorkspaceSubKPIProgress";
import WorkspaceSubOKRProgress from "./pages/workspace/stubs/WorkspaceSubOKRProgress";

import {
  Variant_DivisionHead_Director_PresidentDirector_DepartmentHead_CompanyAdmin,
  Variant_Inactive_Active_Unassigned,
} from "./backend.d";

// ─── Root Gate Component ─────────────────────────────────────────────────────
function RootGate() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: isActorFetching } = useActor();
  const { data: profile, isLoading: isProfileLoading } = useMyProfile();

  const isLoading = isInitializing || isActorFetching || isProfileLoading;

  if (isLoading) {
    return <FullScreenLoader />;
  }

  // Not authenticated — go to onboard
  if (!identity) {
    return <Navigate to="/onboard" />;
  }

  // Authenticated but no profile — go to onboard
  if (!profile) {
    return <Navigate to="/onboard" />;
  }

  if (profile.status === Variant_Inactive_Active_Unassigned.Unassigned) {
    return <Navigate to="/pending" />;
  }

  if (profile.status === Variant_Inactive_Active_Unassigned.Inactive) {
    return <Navigate to="/inactive" />;
  }

  if (profile.status === Variant_Inactive_Active_Unassigned.Active) {
    const isAdmin = profile.roles.some(
      (r) =>
        r.roleType ===
        Variant_DivisionHead_Director_PresidentDirector_DepartmentHead_CompanyAdmin.CompanyAdmin,
    );
    if (isAdmin) {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/workspace" />;
  }

  return <Navigate to="/onboard" />;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-border" />
          <Loader2
            className="w-16 h-16 absolute inset-0 animate-spin text-primary"
            strokeWidth={1.5}
          />
        </div>
        <p className="text-sm text-muted-foreground font-body">
          Loading Corporate Performance…
        </p>
      </div>
    </div>
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-right" richColors />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: RootGate,
});

// Onboard routes
const onboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboard",
  component: OnboardLanding,
});

const onboardCompanyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboard/company",
  component: OnboardCompany,
});

const onboardJoinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboard/join",
  component: OnboardJoin,
});

// Status pages
const pendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pending",
  component: PendingPage,
});

const inactiveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inactive",
  component: InactivePage,
});

// Admin routes
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLayout,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/",
  component: () => <Navigate to="/admin/company-setup" />,
});

const adminCompanySetupRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/company-setup",
  component: AdminCompanySetup,
});

const adminRegistrationCodesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/registration-codes",
  component: AdminRegistrationCodes,
});

const adminOrgStructureRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/organization-structure",
  component: AdminOrgStructure,
});

const adminRoleAssignmentRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/role-assignment",
  component: AdminRoleAssignment,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/users",
  component: AdminUsers,
});

const adminKPIOKRYearsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/kpi-okr-years",
  component: AdminKPIOKRYears,
});

const adminBSCAspectsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/bsc-aspects",
  component: AdminBSCAspects,
});

const adminStrategicObjectivesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/strategic-objectives",
  component: AdminStrategicObjectives,
});

const adminKPIViewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/kpi-view",
  component: AdminKPIView,
});

const adminOKRViewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/okr-view",
  component: AdminOKRView,
});

// Workspace routes
const workspaceLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workspace",
  component: WorkspaceLayout,
});

const workspaceIndexRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: "/",
  component: () => <Navigate to="/workspace/kpi-proposal" />,
});

const workspaceKPIProposalRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: "/kpi-proposal",
  component: WorkspaceKPIProposal,
});

const workspaceKPIApprovalRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: "/kpi-approval",
  component: WorkspaceKPIApproval,
});

const workspaceKPIProgressRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: "/kpi-progress",
  component: WorkspaceKPIProgress,
});

const workspaceSubKPIProgressRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: "/subordinate-kpi-progress",
  component: WorkspaceSubKPIProgress,
});

const workspaceOKRProposalRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: "/okr-proposal",
  component: WorkspaceOKRProposal,
});

const workspaceOKRApprovalRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: "/okr-approval",
  component: WorkspaceOKRApproval,
});

const workspaceOKRProgressRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: "/okr-progress",
  component: WorkspaceOKRProgress,
});

const workspaceSubOKRProgressRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: "/subordinate-okr-progress",
  component: WorkspaceSubOKRProgress,
});

// ─── Router ──────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  onboardRoute,
  onboardCompanyRoute,
  onboardJoinRoute,
  pendingRoute,
  inactiveRoute,
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminCompanySetupRoute,
    adminRegistrationCodesRoute,
    adminOrgStructureRoute,
    adminRoleAssignmentRoute,
    adminUsersRoute,
    adminKPIOKRYearsRoute,
    adminBSCAspectsRoute,
    adminStrategicObjectivesRoute,
    adminKPIViewRoute,
    adminOKRViewRoute,
  ]),
  workspaceLayoutRoute.addChildren([
    workspaceIndexRoute,
    workspaceKPIProposalRoute,
    workspaceKPIApprovalRoute,
    workspaceKPIProgressRoute,
    workspaceSubKPIProgressRoute,
    workspaceOKRProposalRoute,
    workspaceOKRApprovalRoute,
    workspaceOKRProgressRoute,
    workspaceSubOKRProgressRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
