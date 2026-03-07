import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RoleAssignment {
    orgNodeId?: OrgNodeId;
    roleType: Variant_DivisionHead_Director_PresidentDirector_DepartmentHead_CompanyAdmin;
    assignedAt: bigint;
    assignedBy: Principal;
    userId: UserId;
    activeStatus: boolean;
    ultimateParentId?: string;
    assignmentId: RoleAssignmentId;
    parentId?: string;
    grandParentId?: string;
    companyId: CompanyId;
}
export type RoleAssignmentId = string;
export type RegistrationCode = string;
export interface KPIYear {
    status: Variant_Open_Closed;
    kpiYearId: KPIYearId;
    createdAt: bigint;
    createdBy: Principal;
    year: bigint;
    companyId: CompanyId;
}
export interface StrategicObjective {
    createdAt: bigint;
    createdBy: Principal;
    objectiveId: StrategicObjectiveId;
    bscAspectId: BSCAspectId;
    objectiveName: string;
    companyId: CompanyId;
}
export type StrategicObjectiveId = string;
export interface User {
    status: Variant_Inactive_Active_Unassigned;
    userId: UserId;
    createdAt: bigint;
    createdBy: Principal;
    fullName: string;
    emailAddress?: string;
    registrationCodeUsed?: string;
    principalId: Principal;
    companyId: CompanyId;
}
export interface KPI {
    strategicObjectiveId: string;
    kpiMeasurement: string;
    kpiYearId: string;
    createdAt: bigint;
    createdBy: Principal;
    ownerRoleAssignmentId: string;
    kpiWeight: number;
    kpiStatus: Variant_Approved_Draft_Submitted_Revised;
    updatedAt: bigint;
    updatedBy: Principal;
    approverUserId?: string;
    kpiPeriod: Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual;
    bscAspectId: string;
    revisionNotes?: string;
    kpiId: KPIId;
    organizationNodeId: string;
    companyId: CompanyId;
}
export type KPIYearId = string;
export interface BSCAspect {
    createdAt: bigint;
    createdBy: Principal;
    aspectId: BSCAspectId;
    aspectName: string;
    companyId: CompanyId;
}
export interface AuditLog {
    action: string;
    auditId: AuditId;
    entityId: string;
    performedBy: Principal;
    timestamp: bigint;
    entityType: string;
    companyId: CompanyId;
}
export interface MyProfile {
    status: Variant_Inactive_Active_Unassigned;
    userId: UserId;
    fullName: string;
    principalId: Principal;
    roles: Array<RoleAssignment>;
    companyId: CompanyId;
}
export type BSCAspectId = string;
export type AuditId = string;
export type UserId = string;
export type CompanyId = string;
export type KPIId = string;
export interface OrgNode {
    nodeId: OrgNodeId;
    parentNodeId?: OrgNodeId;
    createdAt: bigint;
    createdBy: Principal;
    updatedAt: bigint;
    updatedBy: Principal;
    nodeName: string;
    nodeType: Variant_Division_Director_PresidentDirector_Department;
    companyId: CompanyId;
}
export type OrgNodeId = string;
export type OKRId = string;
export interface RegistrationCodeRecord {
    code: string;
    createdAt: bigint;
    createdBy: Principal;
    isActive: boolean;
    companyId: string;
}
export interface UserProfile {
    name: string;
}
export interface OKR {
    initialTargetDate: string;
    okrStatus: Variant_Approved_Draft_Rejected_Submitted_Revised;
    okrId: OKRId;
    approver2RoleAssignmentId?: string;
    kpiYearId: KPIYearId;
    objective: string;
    createdAt: bigint;
    createdBy: Principal;
    realization: Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending;
    ownerRoleAssignmentId: string;
    okrAspect: Variant_People_Tools_Process;
    revisedTargetDate?: string;
    notes?: string;
    keyResult: string;
    approver1RoleAssignmentId?: string;
    targetValue: number;
    companyId: CompanyId;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_Approved_Draft_Rejected_Submitted_Revised {
    Approved = "Approved",
    Draft = "Draft",
    Rejected = "Rejected",
    Submitted = "Submitted",
    Revised = "Revised"
}
export enum Variant_Approved_Draft_Submitted_Revised {
    Approved = "Approved",
    Draft = "Draft",
    Submitted = "Submitted",
    Revised = "Revised"
}
export enum Variant_DivisionHead_Director_PresidentDirector_DepartmentHead_CompanyAdmin {
    DivisionHead = "DivisionHead",
    Director = "Director",
    PresidentDirector = "PresidentDirector",
    DepartmentHead = "DepartmentHead",
    CompanyAdmin = "CompanyAdmin"
}
export enum Variant_Division_Director_PresidentDirector_Department {
    Division = "Division",
    Director = "Director",
    PresidentDirector = "PresidentDirector",
    Department = "Department"
}
export enum Variant_Done_OnProgress_Backlog_CarriedForNextYear_Pending {
    Done = "Done",
    OnProgress = "OnProgress",
    Backlog = "Backlog",
    CarriedForNextYear = "CarriedForNextYear",
    Pending = "Pending"
}
export enum Variant_Inactive_Active_Unassigned {
    Inactive = "Inactive",
    Active = "Active",
    Unassigned = "Unassigned"
}
export enum Variant_OneTime_Quarterly_Monthly_SemiAnnual_Annual {
    OneTime = "OneTime",
    Quarterly = "Quarterly",
    Monthly = "Monthly",
    SemiAnnual = "SemiAnnual",
    Annual = "Annual"
}
export enum Variant_Open_Closed {
    Open = "Open",
    Closed = "Closed"
}
export enum Variant_People_Tools_Process {
    People = "People",
    Tools = "Tools",
    Process = "Process"
}
export interface backendInterface {
    approveKPI(kpiId: KPIId): Promise<void>;
    approveOKR(okrId: OKRId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignRole(userId: UserId, roleType: string, organizationNodeId: string | null): Promise<void>;
    createBSCAspect(aspectName: string): Promise<BSCAspectId>;
    createCompany(companyName: string, adminFullName: string, email: string | null): Promise<CompanyId>;
    createKPI(kpiYearId: string, bscAspectId: string, strategicObjectiveId: string, organizationNodeId: string, kpiMeasurement: string, kpiPeriod: string, kpiWeight: number): Promise<KPIId>;
    createKPIYear(year: bigint): Promise<KPIYearId>;
    createOKR(kpiYearId: string, okrAspect: string, objective: string, keyResult: string, targetValue: number, initialTargetDate: string): Promise<OKRId>;
    createOrganizationNode(nodeType: string, nodeName: string, parentNodeId: string | null): Promise<OrgNodeId>;
    createStrategicObjective(bscAspectId: BSCAspectId, objectiveName: string): Promise<StrategicObjectiveId>;
    deactivateRegistrationCode(code: string): Promise<void>;
    deactivateRoleAssignment(assignmentId: RoleAssignmentId): Promise<void>;
    deleteKPI(kpiId: KPIId): Promise<void>;
    deleteOKR(okrId: OKRId): Promise<void>;
    generateRegistrationCode(): Promise<RegistrationCode>;
    getAuditLogs(entityType: string | null, entityId: string | null): Promise<Array<AuditLog>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getKPI(kpiId: KPIId): Promise<KPI | null>;
    getMyProfile(): Promise<MyProfile | null>;
    getOKR(okrId: OKRId): Promise<OKR | null>;
    getUserById(userId: UserId): Promise<User | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinCompany(code: string, fullName: string, email: string | null): Promise<CompanyId>;
    listBSCAspects(): Promise<Array<BSCAspect>>;
    listKPIYears(): Promise<Array<KPIYear>>;
    listKPIs(kpiYearId: string | null, organizationNodeId: string | null, statusFilter: string | null): Promise<Array<KPI>>;
    listOKRs(kpiYearId: string | null, statusFilter: string | null): Promise<Array<OKR>>;
    listOrganizationNodes(): Promise<Array<OrgNode>>;
    listRegistrationCodes(): Promise<Array<RegistrationCodeRecord>>;
    listRoleAssignments(userId: UserId | null): Promise<Array<RoleAssignment>>;
    listStrategicObjectives(bscAspectId: BSCAspectId | null): Promise<Array<StrategicObjective>>;
    listUsers(): Promise<Array<User>>;
    rejectKPI(kpiId: KPIId, revisionNotes: string): Promise<void>;
    rejectOKR(okrId: OKRId, revisionNotes: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setKPIYearStatus(kpiYearId: KPIYearId, newStatus: string): Promise<void>;
    submitKPI(kpiId: KPIId): Promise<void>;
    submitOKR(okrId: OKRId): Promise<void>;
    updateBSCAspect(aspectId: BSCAspectId, aspectName: string): Promise<void>;
    updateKPI(kpiId: KPIId, bscAspectId: string, strategicObjectiveId: string, kpiMeasurement: string, kpiPeriod: string, kpiWeight: number): Promise<void>;
    updateKPIProgress(kpiId: KPIId, periodIndex: bigint, achievement: number): Promise<void>;
    updateOKR(okrId: OKRId, okrAspect: string, objective: string, keyResult: string, targetValue: number, initialTargetDate: string, revisedTargetDate: string | null): Promise<void>;
    updateOKRProgress(okrId: OKRId, realization: string, notes: string | null): Promise<void>;
    updateOrganizationNode(nodeId: OrgNodeId, nodeName: string): Promise<void>;
    updateStrategicObjective(objectiveId: StrategicObjectiveId, objectiveName: string): Promise<void>;
    updateUserStatus(userId: UserId, newStatus: string): Promise<void>;
    updateOKRProgressWithDate(okrId: OKRId, realization: string, notes: string | null, revisedTargetDate: string | null): Promise<void>;
}
