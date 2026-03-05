/**
 * backendExtended.ts
 *
 * Provides actor calls for ALL backend methods using a full Candid IDL.
 * The locked backend.ts only exposes 4 company methods, so ALL hooks
 * must use getExtendedActor(identity) instead of the auto-generated actor.
 *
 * Identity comes from useInternetIdentity() and is passed in by callers.
 */

import { Actor, HttpAgent } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

// ─── Config loader ────────────────────────────────────────────────────────────

let _cachedConfig: { host: string; canisterId: string } | null = null;

async function loadBackendConfig(): Promise<{
  host: string;
  canisterId: string;
}> {
  if (_cachedConfig) return _cachedConfig;

  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}/`
      : "http://localhost:5173/";

  const res = await fetch(`${base}env.json`);
  const cfg = await res.json();

  const canisterId: string =
    cfg.backend_canister_id !== "undefined" && cfg.backend_canister_id
      ? (cfg.backend_canister_id as string)
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((
          (import.meta as unknown as Record<string, unknown>).env as Record<
            string,
            string
          >
        )?.CANISTER_ID_BACKEND ?? "");

  const host: string =
    cfg.backend_host !== "undefined" && cfg.backend_host
      ? (cfg.backend_host as string)
      : "https://ic0.app";

  _cachedConfig = { host, canisterId };
  return _cachedConfig;
}

// ─── Full Candid IDL for all backend methods ──────────────────────────────────

function extendedIdlFactory({
  IDL: IdlParam,
}: {
  IDL: typeof IDL;
}): IDL.ServiceClass {
  // ── Shared record types ───────────────────────────────────────────────────

  const RoleTypeVariant = IdlParam.Variant({
    CompanyAdmin: IdlParam.Null,
    PresidentDirector: IdlParam.Null,
    Director: IdlParam.Null,
    DivisionHead: IdlParam.Null,
    DepartmentHead: IdlParam.Null,
  });

  const RoleAssignmentRecord = IdlParam.Record({
    assignmentId: IdlParam.Text,
    userId: IdlParam.Text,
    companyId: IdlParam.Text,
    roleType: RoleTypeVariant,
    orgNodeId: IdlParam.Opt(IdlParam.Text),
    activeStatus: IdlParam.Bool,
    ultimateParentId: IdlParam.Opt(IdlParam.Text),
    grandParentId: IdlParam.Opt(IdlParam.Text),
    parentId: IdlParam.Opt(IdlParam.Text),
    assignedAt: IdlParam.Int,
    assignedBy: IdlParam.Principal,
  });

  const OrgNodeTypeVariant = IdlParam.Variant({
    PresidentDirector: IdlParam.Null,
    Director: IdlParam.Null,
    Division: IdlParam.Null,
    Department: IdlParam.Null,
  });

  const OrgNodeRecord = IdlParam.Record({
    nodeId: IdlParam.Text,
    companyId: IdlParam.Text,
    nodeType: OrgNodeTypeVariant,
    nodeName: IdlParam.Text,
    parentNodeId: IdlParam.Opt(IdlParam.Text),
    createdAt: IdlParam.Int,
    createdBy: IdlParam.Principal,
    updatedAt: IdlParam.Int,
    updatedBy: IdlParam.Principal,
  });

  const UserStatusVariant = IdlParam.Variant({
    Unassigned: IdlParam.Null,
    Active: IdlParam.Null,
    Inactive: IdlParam.Null,
  });

  const UserRecord = IdlParam.Record({
    userId: IdlParam.Text,
    principalId: IdlParam.Principal,
    companyId: IdlParam.Text,
    fullName: IdlParam.Text,
    emailAddress: IdlParam.Opt(IdlParam.Text),
    registrationCodeUsed: IdlParam.Opt(IdlParam.Text),
    status: UserStatusVariant,
    createdAt: IdlParam.Int,
    createdBy: IdlParam.Principal,
  });

  const KPIYearStatusVariant = IdlParam.Variant({
    Open: IdlParam.Null,
    Closed: IdlParam.Null,
  });

  const KPIYearRecord = IdlParam.Record({
    kpiYearId: IdlParam.Text,
    companyId: IdlParam.Text,
    year: IdlParam.Int,
    status: KPIYearStatusVariant,
    createdAt: IdlParam.Int,
    createdBy: IdlParam.Principal,
  });

  const BSCAspectRecord = IdlParam.Record({
    aspectId: IdlParam.Text,
    companyId: IdlParam.Text,
    aspectName: IdlParam.Text,
    createdAt: IdlParam.Int,
    createdBy: IdlParam.Principal,
  });

  const StrategicObjectiveRecord = IdlParam.Record({
    objectiveId: IdlParam.Text,
    companyId: IdlParam.Text,
    bscAspectId: IdlParam.Text,
    objectiveName: IdlParam.Text,
    createdAt: IdlParam.Int,
    createdBy: IdlParam.Principal,
  });

  const RegistrationCodeRecord = IdlParam.Record({
    code: IdlParam.Text,
    companyId: IdlParam.Text,
    isActive: IdlParam.Bool,
    createdAt: IdlParam.Int,
    createdBy: IdlParam.Principal,
  });

  const KPIPeriodVariant = IdlParam.Variant({
    OneTime: IdlParam.Null,
    Annual: IdlParam.Null,
    Monthly: IdlParam.Null,
    Quarterly: IdlParam.Null,
    SemiAnnual: IdlParam.Null,
  });

  const KPIStatusVariant = IdlParam.Variant({
    Draft: IdlParam.Null,
    Submitted: IdlParam.Null,
    Approved: IdlParam.Null,
    Revised: IdlParam.Null,
  });

  const KPIRecord = IdlParam.Record({
    kpiId: IdlParam.Text,
    companyId: IdlParam.Text,
    ownerRoleAssignmentId: IdlParam.Text,
    organizationNodeId: IdlParam.Text,
    approverUserId: IdlParam.Opt(IdlParam.Text),
    kpiYearId: IdlParam.Text,
    bscAspectId: IdlParam.Text,
    strategicObjectiveId: IdlParam.Text,
    kpiMeasurement: IdlParam.Text,
    kpiPeriod: KPIPeriodVariant,
    kpiWeight: IdlParam.Float64,
    kpiStatus: KPIStatusVariant,
    revisionNotes: IdlParam.Opt(IdlParam.Text),
    createdAt: IdlParam.Int,
    createdBy: IdlParam.Principal,
    updatedAt: IdlParam.Int,
    updatedBy: IdlParam.Principal,
  });

  const OKRStatusVariant = IdlParam.Variant({
    Draft: IdlParam.Null,
    Submitted: IdlParam.Null,
    Approved: IdlParam.Null,
    Revised: IdlParam.Null,
    Rejected: IdlParam.Null,
  });

  const OKRAspectVariant = IdlParam.Variant({
    Tools: IdlParam.Null,
    Process: IdlParam.Null,
    People: IdlParam.Null,
  });

  const OKRRealizationVariant = IdlParam.Variant({
    Backlog: IdlParam.Null,
    OnProgress: IdlParam.Null,
    Pending: IdlParam.Null,
    Done: IdlParam.Null,
    CarriedForNextYear: IdlParam.Null,
  });

  const OKRRecord = IdlParam.Record({
    okrId: IdlParam.Text,
    companyId: IdlParam.Text,
    kpiYearId: IdlParam.Text,
    ownerRoleAssignmentId: IdlParam.Text,
    approver1RoleAssignmentId: IdlParam.Opt(IdlParam.Text),
    approver2RoleAssignmentId: IdlParam.Opt(IdlParam.Text),
    okrStatus: OKRStatusVariant,
    okrAspect: OKRAspectVariant,
    objective: IdlParam.Text,
    keyResult: IdlParam.Text,
    targetValue: IdlParam.Float64,
    initialTargetDate: IdlParam.Text,
    revisedTargetDate: IdlParam.Opt(IdlParam.Text),
    realization: OKRRealizationVariant,
    notes: IdlParam.Opt(IdlParam.Text),
    createdAt: IdlParam.Int,
    createdBy: IdlParam.Principal,
  });

  const MyProfileRecord = IdlParam.Record({
    userId: IdlParam.Text,
    principalId: IdlParam.Principal,
    companyId: IdlParam.Text,
    fullName: IdlParam.Text,
    status: UserStatusVariant,
    roles: IdlParam.Vec(RoleAssignmentRecord),
  });

  const CompanyInfoRecord = IdlParam.Record({
    companyId: IdlParam.Text,
    companyName: IdlParam.Text,
    activeStatus: IdlParam.Variant({
      Active: IdlParam.Null,
      Inactive: IdlParam.Null,
    }),
    createdAt: IdlParam.Int,
    createdBy: IdlParam.Principal,
  });

  const AuditLogRecord = IdlParam.Record({
    auditId: IdlParam.Text,
    companyId: IdlParam.Text,
    entityType: IdlParam.Text,
    entityId: IdlParam.Text,
    action: IdlParam.Text,
    performedBy: IdlParam.Principal,
    timestamp: IdlParam.Int,
  });

  const KPITargetRecord = IdlParam.Record({
    targetId: IdlParam.Text,
    kpiId: IdlParam.Text,
    periodIndex: IdlParam.Nat,
    targetValue: IdlParam.Float64,
  });

  const KPIProgressRecord = IdlParam.Record({
    progressId: IdlParam.Text,
    kpiId: IdlParam.Text,
    periodIndex: IdlParam.Nat,
    achievement: IdlParam.Float64,
    score: IdlParam.Float64,
    updatedAt: IdlParam.Int,
    updatedBy: IdlParam.Opt(IdlParam.Principal),
  });

  // ── Service definition ────────────────────────────────────────────────────

  return IdlParam.Service({
    // ── Auth / Profile ────────────────────────────────────────────────────
    getMyProfile: IdlParam.Func([], [IdlParam.Opt(MyProfileRecord)], ["query"]),

    // ── Company ───────────────────────────────────────────────────────────
    createCompany: IdlParam.Func(
      [IdlParam.Text, IdlParam.Text, IdlParam.Opt(IdlParam.Text)],
      [IdlParam.Text],
      [],
    ),
    joinCompany: IdlParam.Func(
      [IdlParam.Text, IdlParam.Text, IdlParam.Opt(IdlParam.Text)],
      [IdlParam.Text],
      [],
    ),
    getCompanyInfo: IdlParam.Func(
      [],
      [IdlParam.Opt(CompanyInfoRecord)],
      ["query"],
    ),
    updateCompanyName: IdlParam.Func([IdlParam.Text], [], []),
    deactivateCompany: IdlParam.Func([], [], []),
    resetYearProgressData: IdlParam.Func([IdlParam.Text], [], []),

    // ── Registration Codes ────────────────────────────────────────────────
    generateRegistrationCode: IdlParam.Func([], [IdlParam.Text], []),
    listRegistrationCodes: IdlParam.Func(
      [],
      [IdlParam.Vec(RegistrationCodeRecord)],
      ["query"],
    ),
    deactivateRegistrationCode: IdlParam.Func([IdlParam.Text], [], []),

    // ── Organization Nodes ────────────────────────────────────────────────
    createOrganizationNode: IdlParam.Func(
      [IdlParam.Text, IdlParam.Text, IdlParam.Opt(IdlParam.Text)],
      [IdlParam.Text],
      [],
    ),
    updateOrganizationNode: IdlParam.Func(
      [IdlParam.Text, IdlParam.Text],
      [],
      [],
    ),
    listOrganizationNodes: IdlParam.Func(
      [],
      [IdlParam.Vec(OrgNodeRecord)],
      ["query"],
    ),

    // ── Users ─────────────────────────────────────────────────────────────
    listUsers: IdlParam.Func([], [IdlParam.Vec(UserRecord)], ["query"]),
    updateUserStatus: IdlParam.Func([IdlParam.Text, IdlParam.Text], [], []),
    getUserById: IdlParam.Func(
      [IdlParam.Text],
      [IdlParam.Opt(UserRecord)],
      ["query"],
    ),

    // ── Role Assignments ──────────────────────────────────────────────────
    assignRole: IdlParam.Func(
      [IdlParam.Text, IdlParam.Text, IdlParam.Opt(IdlParam.Text)],
      [],
      [],
    ),
    deactivateRoleAssignment: IdlParam.Func([IdlParam.Text], [], []),
    listRoleAssignments: IdlParam.Func(
      [IdlParam.Opt(IdlParam.Text)],
      [IdlParam.Vec(RoleAssignmentRecord)],
      ["query"],
    ),

    // ── KPI Years ─────────────────────────────────────────────────────────
    createKPIYear: IdlParam.Func([IdlParam.Int], [IdlParam.Text], []),
    setKPIYearStatus: IdlParam.Func([IdlParam.Text, IdlParam.Text], [], []),
    listKPIYears: IdlParam.Func([], [IdlParam.Vec(KPIYearRecord)], ["query"]),

    // ── BSC Aspects ───────────────────────────────────────────────────────
    createBSCAspect: IdlParam.Func([IdlParam.Text], [IdlParam.Text], []),
    updateBSCAspect: IdlParam.Func([IdlParam.Text, IdlParam.Text], [], []),
    listBSCAspects: IdlParam.Func(
      [],
      [IdlParam.Vec(BSCAspectRecord)],
      ["query"],
    ),

    // ── Strategic Objectives ──────────────────────────────────────────────
    createStrategicObjective: IdlParam.Func(
      [IdlParam.Text, IdlParam.Text],
      [IdlParam.Text],
      [],
    ),
    updateStrategicObjective: IdlParam.Func(
      [IdlParam.Text, IdlParam.Text],
      [],
      [],
    ),
    listStrategicObjectives: IdlParam.Func(
      [IdlParam.Opt(IdlParam.Text)],
      [IdlParam.Vec(StrategicObjectiveRecord)],
      ["query"],
    ),

    // ── KPI CRUD ──────────────────────────────────────────────────────────
    createKPI: IdlParam.Func(
      [
        IdlParam.Text, // kpiYearId
        IdlParam.Text, // bscAspectId
        IdlParam.Text, // strategicObjectiveId
        IdlParam.Text, // organizationNodeId
        IdlParam.Text, // kpiMeasurement
        IdlParam.Opt(IdlParam.Text), // kpiScoreParameter
        IdlParam.Text, // kpiPeriod
        IdlParam.Float64, // kpiWeight
      ],
      [IdlParam.Text],
      [],
    ),
    updateKPI: IdlParam.Func(
      [
        IdlParam.Text, // kpiId
        IdlParam.Text, // bscAspectId
        IdlParam.Text, // strategicObjectiveId
        IdlParam.Text, // kpiMeasurement
        IdlParam.Opt(IdlParam.Text), // kpiScoreParameter
        IdlParam.Text, // kpiPeriod
        IdlParam.Float64, // kpiWeight
      ],
      [],
      [],
    ),
    deleteKPI: IdlParam.Func([IdlParam.Text], [], []),
    submitKPI: IdlParam.Func([IdlParam.Text], [], []),
    approveKPI: IdlParam.Func([IdlParam.Text], [], []),
    rejectKPI: IdlParam.Func([IdlParam.Text, IdlParam.Text], [], []),
    listKPIs: IdlParam.Func(
      [
        IdlParam.Opt(IdlParam.Text), // kpiYearId
        IdlParam.Opt(IdlParam.Text), // organizationNodeId
        IdlParam.Opt(IdlParam.Text), // statusFilter
      ],
      [IdlParam.Vec(KPIRecord)],
      ["query"],
    ),
    getKPI: IdlParam.Func(
      [IdlParam.Text],
      [IdlParam.Opt(KPIRecord)],
      ["query"],
    ),

    // ── KPI Targets ───────────────────────────────────────────────────────
    saveKPITargets: IdlParam.Func(
      [
        IdlParam.Text, // kpiId
        IdlParam.Vec(IdlParam.Tuple(IdlParam.Nat, IdlParam.Float64)),
      ],
      [],
      [],
    ),
    getKPITargets: IdlParam.Func(
      [IdlParam.Text],
      [IdlParam.Vec(KPITargetRecord)],
      ["query"],
    ),
    getKPIScoreParameter: IdlParam.Func(
      [IdlParam.Text],
      [IdlParam.Opt(IdlParam.Text)],
      ["query"],
    ),

    // ── KPI Progress ──────────────────────────────────────────────────────
    updateKPIProgress: IdlParam.Func(
      [
        IdlParam.Text, // kpiId
        IdlParam.Nat, // periodIndex
        IdlParam.Float64, // achievement
        IdlParam.Float64, // score
      ],
      [],
      [],
    ),
    getKPIProgressList: IdlParam.Func(
      [IdlParam.Text],
      [IdlParam.Vec(KPIProgressRecord)],
      ["query"],
    ),

    // ── OKR ───────────────────────────────────────────────────────────────
    createOKR: IdlParam.Func(
      [
        IdlParam.Text, // kpiYearId
        IdlParam.Text, // okrAspect
        IdlParam.Text, // objective
        IdlParam.Text, // keyResult
        IdlParam.Float64, // targetValue
        IdlParam.Text, // initialTargetDate
      ],
      [IdlParam.Text],
      [],
    ),
    updateOKR: IdlParam.Func(
      [
        IdlParam.Text, // okrId
        IdlParam.Text, // okrAspect
        IdlParam.Text, // objective
        IdlParam.Text, // keyResult
        IdlParam.Float64, // targetValue
        IdlParam.Text, // initialTargetDate
        IdlParam.Opt(IdlParam.Text), // revisedTargetDate
      ],
      [],
      [],
    ),
    submitOKR: IdlParam.Func([IdlParam.Text], [], []),
    approveOKR: IdlParam.Func([IdlParam.Text], [], []),
    rejectOKR: IdlParam.Func([IdlParam.Text, IdlParam.Text], [], []),
    updateOKRProgress: IdlParam.Func(
      [
        IdlParam.Text, // okrId
        IdlParam.Text, // realization
        IdlParam.Opt(IdlParam.Text), // notes
      ],
      [],
      [],
    ),
    deleteOKR: IdlParam.Func([IdlParam.Text], [], []),
    listOKRs: IdlParam.Func(
      [
        IdlParam.Opt(IdlParam.Text), // kpiYearId
        IdlParam.Opt(IdlParam.Text), // statusFilter
      ],
      [IdlParam.Vec(OKRRecord)],
      ["query"],
    ),
    getOKR: IdlParam.Func(
      [IdlParam.Text],
      [IdlParam.Opt(OKRRecord)],
      ["query"],
    ),

    // ── Audit ─────────────────────────────────────────────────────────────
    getAuditLogs: IdlParam.Func(
      [
        IdlParam.Opt(IdlParam.Text), // entityType
        IdlParam.Opt(IdlParam.Text), // entityId
      ],
      [IdlParam.Vec(AuditLogRecord)],
      ["query"],
    ),
  });
}

// ─── Raw Candid types (as returned by the JS agent) ──────────────────────────

export interface RoleAssignmentRaw {
  assignmentId: string;
  userId: string;
  companyId: string;
  roleType: Record<string, null>;
  orgNodeId: [string] | [];
  activeStatus: boolean;
  ultimateParentId: [string] | [];
  grandParentId: [string] | [];
  parentId: [string] | [];
  assignedAt: bigint;
  assignedBy: unknown;
}

export interface OrgNodeRaw {
  nodeId: string;
  companyId: string;
  nodeType: Record<string, null>;
  nodeName: string;
  parentNodeId: [string] | [];
  createdAt: bigint;
  createdBy: unknown;
  updatedAt: bigint;
  updatedBy: unknown;
}

export interface UserRaw {
  userId: string;
  principalId: unknown;
  companyId: string;
  fullName: string;
  emailAddress: [string] | [];
  registrationCodeUsed: [string] | [];
  status: Record<string, null>;
  createdAt: bigint;
  createdBy: unknown;
}

export interface KPIYearRaw {
  kpiYearId: string;
  companyId: string;
  year: bigint;
  status: Record<string, null>;
  createdAt: bigint;
  createdBy: unknown;
}

export interface BSCAspectRaw {
  aspectId: string;
  companyId: string;
  aspectName: string;
  createdAt: bigint;
  createdBy: unknown;
}

export interface StrategicObjectiveRaw {
  objectiveId: string;
  companyId: string;
  bscAspectId: string;
  objectiveName: string;
  createdAt: bigint;
  createdBy: unknown;
}

export interface RegistrationCodeRecordRaw {
  code: string;
  companyId: string;
  isActive: boolean;
  createdAt: bigint;
  createdBy: unknown;
}

export interface KPIRaw {
  kpiId: string;
  companyId: string;
  ownerRoleAssignmentId: string;
  organizationNodeId: string;
  approverUserId: [string] | [];
  kpiYearId: string;
  bscAspectId: string;
  strategicObjectiveId: string;
  kpiMeasurement: string;
  kpiPeriod: Record<string, null>;
  kpiWeight: number;
  kpiStatus: Record<string, null>;
  revisionNotes: [string] | [];
  createdAt: bigint;
  createdBy: unknown;
  updatedAt: bigint;
  updatedBy: unknown;
}

export interface OKRRaw {
  okrId: string;
  companyId: string;
  kpiYearId: string;
  ownerRoleAssignmentId: string;
  approver1RoleAssignmentId: [string] | [];
  approver2RoleAssignmentId: [string] | [];
  okrStatus: Record<string, null>;
  okrAspect: Record<string, null>;
  objective: string;
  keyResult: string;
  targetValue: number;
  initialTargetDate: string;
  revisedTargetDate: [string] | [];
  realization: Record<string, null>;
  notes: [string] | [];
  createdAt: bigint;
  createdBy: unknown;
}

export interface MyProfileRaw {
  userId: string;
  principalId: unknown;
  companyId: string;
  fullName: string;
  status: Record<string, null>;
  roles: RoleAssignmentRaw[];
}

export interface CompanyInfoRaw {
  companyId: string;
  companyName: string;
  activeStatus: { Active: null } | { Inactive: null };
  createdAt: bigint;
  createdBy: unknown;
}

export interface AuditLogRaw {
  auditId: string;
  companyId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: unknown;
  timestamp: bigint;
}

export interface KPITargetRecord {
  targetId: string;
  kpiId: string;
  periodIndex: bigint;
  targetValue: number;
}

export interface KPIProgressRecord {
  progressId: string;
  kpiId: string;
  periodIndex: bigint;
  achievement: number;
  score: number;
  updatedAt: bigint;
  updatedBy: unknown;
}

export interface KPIProgressData {
  targets: KPITargetRecord[];
  progress: KPIProgressRecord[];
}

// Keep CompanyInfo for backward compat with existing imports
export type CompanyInfo = CompanyInfoRaw;

// ─── ExtendedActor interface ──────────────────────────────────────────────────

export interface ExtendedActor {
  // Auth / Profile
  getMyProfile: () => Promise<[MyProfileRaw] | []>;

  // Company
  createCompany: (
    companyName: string,
    adminFullName: string,
    email: [string] | [],
  ) => Promise<string>;
  joinCompany: (
    code: string,
    fullName: string,
    email: [string] | [],
  ) => Promise<string>;
  getCompanyInfo: () => Promise<[CompanyInfoRaw] | []>;
  updateCompanyName: (newName: string) => Promise<void>;
  deactivateCompany: () => Promise<void>;
  resetYearProgressData: (kpiYearId: string) => Promise<void>;

  // Registration Codes
  generateRegistrationCode: () => Promise<string>;
  listRegistrationCodes: () => Promise<RegistrationCodeRecordRaw[]>;
  deactivateRegistrationCode: (code: string) => Promise<void>;

  // Organization Nodes
  createOrganizationNode: (
    nodeType: string,
    nodeName: string,
    parentNodeId: [string] | [],
  ) => Promise<string>;
  updateOrganizationNode: (nodeId: string, nodeName: string) => Promise<void>;
  listOrganizationNodes: () => Promise<OrgNodeRaw[]>;

  // Users
  listUsers: () => Promise<UserRaw[]>;
  updateUserStatus: (userId: string, newStatus: string) => Promise<void>;
  getUserById: (userId: string) => Promise<[UserRaw] | []>;

  // Role Assignments
  assignRole: (
    userId: string,
    roleType: string,
    organizationNodeId: [string] | [],
  ) => Promise<void>;
  deactivateRoleAssignment: (assignmentId: string) => Promise<void>;
  listRoleAssignments: (userId: [string] | []) => Promise<RoleAssignmentRaw[]>;

  // KPI Years
  createKPIYear: (year: bigint) => Promise<string>;
  setKPIYearStatus: (kpiYearId: string, newStatus: string) => Promise<void>;
  listKPIYears: () => Promise<KPIYearRaw[]>;

  // BSC Aspects
  createBSCAspect: (aspectName: string) => Promise<string>;
  updateBSCAspect: (aspectId: string, aspectName: string) => Promise<void>;
  listBSCAspects: () => Promise<BSCAspectRaw[]>;

  // Strategic Objectives
  createStrategicObjective: (
    bscAspectId: string,
    objectiveName: string,
  ) => Promise<string>;
  updateStrategicObjective: (
    objectiveId: string,
    objectiveName: string,
  ) => Promise<void>;
  listStrategicObjectives: (
    bscAspectId: [string] | [],
  ) => Promise<StrategicObjectiveRaw[]>;

  // KPI CRUD
  createKPI: (
    kpiYearId: string,
    bscAspectId: string,
    strategicObjectiveId: string,
    organizationNodeId: string,
    kpiMeasurement: string,
    kpiScoreParameter: [string] | [],
    kpiPeriod: string,
    kpiWeight: number,
  ) => Promise<string>;
  updateKPI: (
    kpiId: string,
    bscAspectId: string,
    strategicObjectiveId: string,
    kpiMeasurement: string,
    kpiScoreParameter: [string] | [],
    kpiPeriod: string,
    kpiWeight: number,
  ) => Promise<void>;
  deleteKPI: (kpiId: string) => Promise<void>;
  submitKPI: (kpiId: string) => Promise<void>;
  approveKPI: (kpiId: string) => Promise<void>;
  rejectKPI: (kpiId: string, revisionNotes: string) => Promise<void>;
  listKPIs: (
    kpiYearId: [string] | [],
    organizationNodeId: [string] | [],
    statusFilter: [string] | [],
  ) => Promise<KPIRaw[]>;
  getKPI: (kpiId: string) => Promise<[KPIRaw] | []>;

  // KPI Targets
  saveKPITargets: (
    kpiId: string,
    targets: Array<[bigint, number]>,
  ) => Promise<void>;
  getKPITargets: (kpiId: string) => Promise<KPITargetRecord[]>;
  getKPIScoreParameter: (kpiId: string) => Promise<[string] | []>;

  // KPI Progress
  updateKPIProgress: (
    kpiId: string,
    periodIndex: bigint,
    achievement: number,
    score: number,
  ) => Promise<void>;
  getKPIProgressList: (kpiId: string) => Promise<KPIProgressRecord[]>;

  // OKR
  createOKR: (
    kpiYearId: string,
    okrAspect: string,
    objective: string,
    keyResult: string,
    targetValue: number,
    initialTargetDate: string,
  ) => Promise<string>;
  updateOKR: (
    okrId: string,
    okrAspect: string,
    objective: string,
    keyResult: string,
    targetValue: number,
    initialTargetDate: string,
    revisedTargetDate: [string] | [],
  ) => Promise<void>;
  submitOKR: (okrId: string) => Promise<void>;
  approveOKR: (okrId: string) => Promise<void>;
  rejectOKR: (okrId: string, revisionNotes: string) => Promise<void>;
  updateOKRProgress: (
    okrId: string,
    realization: string,
    notes: [string] | [],
  ) => Promise<void>;
  deleteOKR: (okrId: string) => Promise<void>;
  listOKRs: (
    kpiYearId: [string] | [],
    statusFilter: [string] | [],
  ) => Promise<OKRRaw[]>;
  getOKR: (okrId: string) => Promise<[OKRRaw] | []>;

  // Audit
  getAuditLogs: (
    entityType: [string] | [],
    entityId: [string] | [],
  ) => Promise<AuditLogRaw[]>;
}

// ─── Actor factory ────────────────────────────────────────────────────────────

let _actorCache: { actor: ExtendedActor; identityKey: string } | null = null;

export function clearActorCache(): void {
  _actorCache = null;
}

export async function getExtendedActor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identity?: any,
): Promise<ExtendedActor> {
  const { host, canisterId } = await loadBackendConfig();

  const identityKey = identity
    ? (identity.getPrincipal?.()?.toText?.() ?? "anon")
    : "anon";

  if (_actorCache && _actorCache.identityKey === identityKey) {
    return _actorCache.actor;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentOptions: Record<string, any> = { host };
  if (identity) {
    agentOptions.identity = identity;
  }

  const agent = await HttpAgent.create(agentOptions);

  if (
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("4943")
  ) {
    await agent.fetchRootKey();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actor = Actor.createActor<ExtendedActor>(extendedIdlFactory as any, {
    agent,
    canisterId,
  }) as ExtendedActor;

  _actorCache = { actor, identityKey };
  return actor;
}

// ─── Candid optional helpers ──────────────────────────────────────────────────

export function toOptText(value: string | null | undefined): [string] | [] {
  if (value && value.trim() !== "") return [value.trim()];
  return [];
}

export function fromOptText(
  value: [string] | [] | string | null | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return (value as string) ?? "";
}
