import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type CompanyId = Text;
  type UserId = Text;
  type RoleAssignmentId = Text;
  type OrgNodeId = Text;
  type RegistrationCode = Text;
  type KPIYearId = Text;
  type BSCAspectId = Text;
  type StrategicObjectiveId = Text;
  type KPIId = Text;
  type TargetId = Text;
  type ProgressId = Text;
  type AuditId = Text;
  type OKRId = Text;

  type Company = {
    companyId : CompanyId;
    companyName : Text;
    activeStatus : { #Active; #Inactive };
    createdAt : Int;
    createdBy : Principal;
  };

  module Company {
    public func compare(company1 : Company, company2 : Company) : Order.Order {
      Text.compare(company1.companyId, company2.companyId);
    };
  };

  type User = {
    userId : UserId;
    principalId : Principal;
    companyId : CompanyId;
    fullName : Text;
    emailAddress : ?Text;
    registrationCodeUsed : ?Text;
    status : { #Unassigned; #Active; #Inactive };
    createdAt : Int;
    createdBy : Principal;
  };

  module User {
    public func compare(user1 : User, user2 : User) : Order.Order {
      Text.compare(user1.userId, user2.userId);
    };
  };

  type RoleAssignment = {
    assignmentId : RoleAssignmentId;
    userId : UserId;
    companyId : CompanyId;
    roleType : {
      #CompanyAdmin;
      #PresidentDirector;
      #Director;
      #DivisionHead;
      #DepartmentHead;
    };
    orgNodeId : ?OrgNodeId;
    activeStatus : Bool;
    ultimateParentId : ?Text;
    grandParentId : ?Text;
    parentId : ?Text;
    assignedAt : Int;
    assignedBy : Principal;
  };

  module RoleAssignment {
    public func compare(roleAssignment1 : RoleAssignment, roleAssignment2 : RoleAssignment) : Order.Order {
      Text.compare(roleAssignment1.assignmentId, roleAssignment2.assignmentId);
    };
  };

  type OrgNode = {
    nodeId : OrgNodeId;
    companyId : CompanyId;
    nodeType : { #PresidentDirector; #Director; #Division; #Department };
    nodeName : Text;
    parentNodeId : ?OrgNodeId;
    createdAt : Int;
    createdBy : Principal;
    updatedAt : Int;
    updatedBy : Principal;
  };

  module OrgNode {
    public func compare(orgNode1 : OrgNode, orgNode2 : OrgNode) : Order.Order {
      Text.compare(orgNode1.nodeId, orgNode2.nodeId);
    };
  };

  type RegistrationCodeRecord = {
    code : Text;
    companyId : Text;
    isActive : Bool;
    createdAt : Int;
    createdBy : Principal;
  };

  type KPIYear = {
    kpiYearId : KPIYearId;
    companyId : CompanyId;
    year : Int;
    status : { #Open; #Closed };
    createdAt : Int;
    createdBy : Principal;
  };

  type BSCAspect = {
    aspectId : BSCAspectId;
    companyId : CompanyId;
    aspectName : Text;
    createdAt : Int;
    createdBy : Principal;
  };

  type StrategicObjective = {
    objectiveId : StrategicObjectiveId;
    companyId : CompanyId;
    bscAspectId : BSCAspectId;
    objectiveName : Text;
    createdAt : Int;
    createdBy : Principal;
  };

  type KPI = {
    kpiId : KPIId;
    companyId : CompanyId;
    ownerRoleAssignmentId : Text;
    organizationNodeId : Text;
    approverUserId : ?Text;
    kpiYearId : Text;
    bscAspectId : Text;
    strategicObjectiveId : Text;
    kpiMeasurement : Text;
    kpiPeriod : { #OneTime; #Annual; #Monthly; #Quarterly; #SemiAnnual };
    kpiWeight : Float;
    kpiStatus : { #Draft; #Submitted; #Approved; #Revised };
    revisionNotes : ?Text;
    createdAt : Int;
    createdBy : Principal;
    updatedAt : Int;
    updatedBy : Principal;
  };

  type KPITarget = {
    targetId : TargetId;
    kpiId : KPIId;
    periodIndex : Nat;
    targetValue : Float;
  };

  type KPIProgress = {
    progressId : ProgressId;
    kpiId : KPIId;
    periodIndex : Nat;
    achievement : Float;
    score : Float;
    updatedAt : Int;
    updatedBy : Principal;
  };

  type OKR = {
    okrId : OKRId;
    companyId : CompanyId;
    kpiYearId : KPIYearId;
    ownerRoleAssignmentId : Text;
    approver1RoleAssignmentId : ?Text;
    approver2RoleAssignmentId : ?Text;
    okrStatus : { #Draft; #Submitted; #Approved; #Revised; #Rejected };
    okrAspect : { #Tools; #Process; #People };
    objective : Text;
    keyResult : Text;
    targetValue : Float;
    initialTargetDate : Text;
    revisedTargetDate : ?Text;
    realization : { #Backlog; #OnProgress; #Pending; #Done; #CarriedForNextYear };
    notes : ?Text;
    createdAt : Int;
    createdBy : Principal;
  };

  type AuditLog = {
    auditId : AuditId;
    companyId : CompanyId;
    entityType : Text;
    entityId : Text;
    action : Text;
    performedBy : Principal;
    timestamp : Int;
  };

  type MyProfile = {
    userId : UserId;
    principalId : Principal;
    companyId : CompanyId;
    fullName : Text;
    status : { #Unassigned; #Active; #Inactive };
    roles : [RoleAssignment];
  };

  type UserProfile = {
    name : Text;
  };

  let companies = Map.empty<CompanyId, Company>();
  let users = Map.empty<UserId, User>();
  let roleAssignments = Map.empty<RoleAssignmentId, RoleAssignment>();
  let orgNodes = Map.empty<OrgNodeId, OrgNode>();
  let registrationCodes = Map.empty<RegistrationCode, RegistrationCodeRecord>();
  let kpiYears = Map.empty<KPIYearId, KPIYear>();
  let bscAspects = Map.empty<BSCAspectId, BSCAspect>();
  let strategicObjectives = Map.empty<StrategicObjectiveId, StrategicObjective>();
  let kpis = Map.empty<KPIId, KPI>();
  // Separate stable store for KPI score parameters (stored outside KPI type
  // to avoid breaking stable variable compatibility on upgrade)
  let kpiScoreParameters = Map.empty<KPIId, Text>();
  let kpiTargets = Map.empty<TargetId, KPITarget>();
  let kpiProgress = Map.empty<ProgressId, KPIProgress>();
  let auditLogs = Map.empty<AuditId, AuditLog>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let okrs = Map.empty<OKRId, OKR>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func generateId() : Text {
    Time.now().toText();
  };

  func getCallerUser(caller : Principal) : ?User {
    users.values().toArray().find(func(u) { u.principalId == caller });
  };

  func requireCallerUser(caller : Principal) : User {
    switch (getCallerUser(caller)) {
      case (null) { Runtime.trap("Unauthorized: User not found") };
      case (?u) { u };
    };
  };

  func getActiveRoleAssignments(userId : UserId) : [RoleAssignment] {
    roleAssignments.values().toArray().filter(
      func(r) {
        r.userId == userId and r.activeStatus
      }
    );
  };

  func isCompanyAdmin(caller : Principal) : Bool {
    switch (getCallerUser(caller)) {
      case (null) { false };
      case (?u) {
        let roles = getActiveRoleAssignments(u.userId);
        not roles.filter(func(r) { r.roleType == #CompanyAdmin }).isEmpty();
      };
    };
  };

  func requireCompanyAdmin(caller : Principal) : User {
    let user = requireCallerUser(caller);
    if (not isCompanyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only COMPANY_ADMIN can perform this action");
    };
    user;
  };

  func requireSameCompany(caller : Principal, companyId : CompanyId) {
    let user = requireCallerUser(caller);
    if (user.companyId != companyId) {
      Runtime.trap("Unauthorized: Access denied to other company data");
    };
  };

  func requireActiveUser(caller : Principal) : User {
    let user = requireCallerUser(caller);
    if (user.status != #Active) {
      Runtime.trap("Unauthorized: User is not active");
    };
    user;
  };

  func countActiveCompanyAdmins(companyId : CompanyId) : Nat {
    var count = 0;
    for ((_, ra) in roleAssignments.entries()) {
      if (ra.companyId == companyId and ra.roleType == #CompanyAdmin and ra.activeStatus) {
        switch (users.get(ra.userId)) {
          case (?u) {
            if (u.status == #Active) {
              count += 1;
            };
          };
          case (null) {};
        };
      };
    };
    count;
  };

  func logAudit(companyId : CompanyId, entityType : Text, entityId : Text, action : Text, performedBy : Principal) {
    let auditId = generateId();
    let log : AuditLog = {
      auditId;
      companyId;
      entityType;
      entityId;
      action;
      performedBy;
      timestamp = Time.now();
    };
    auditLogs.add(auditId, log);
  };

  func resolveHierarchy(nodeId : OrgNodeId) : (?Text, ?Text, ?Text) {
    var ultimateParentId : ?Text = null;
    var grandParentId : ?Text = null;
    var parentId : ?Text = null;

    switch (orgNodes.get(nodeId)) {
      case (null) { (null, null, null) };
      case (?node) {
        parentId := node.parentNodeId;
        switch (node.parentNodeId) {
          case (null) {};
          case (?pid) {
            switch (orgNodes.get(pid)) {
              case (null) {};
              case (?parentNode) {
                grandParentId := parentNode.parentNodeId;
                switch (parentNode.parentNodeId) {
                  case (null) {};
                  case (?gpid) {
                    switch (orgNodes.get(gpid)) {
                      case (null) {};
                      case (?grandParentNode) {
                        ultimateParentId := grandParentNode.parentNodeId;
                      };
                    };
                  };
                };
              };
            };
          };
        };
        (ultimateParentId, grandParentId, parentId);
      };
    };
  };

  func resolveOKRApprovalChain(userId : UserId) : (?Text, ?Text) {
    let userRoles = getActiveRoleAssignments(userId);
    let nonAdminRoles = userRoles.filter(
      func(r) { r.roleType != #CompanyAdmin }
    );
    switch (nonAdminRoles.find(func(r) { r.orgNodeId.isSome() })) {
      case (null) { (null, null) };
      case (?role) {
        switch (role.orgNodeId) {
          case (null) { (null, null) };
          case (?nodeId) {
            let (_, grandParentId, parentId) = resolveHierarchy(nodeId);
            var approver1 : ?Text = null;
            var approver2 : ?Text = null;
            switch (parentId) {
              case (null) {};
              case (?pid) {
                let parentRoles = roleAssignments.values().toArray().filter(
                  func(ra) {
                    ra.activeStatus and
                    (switch (ra.orgNodeId) { case (?nid) { nid == pid }; case (null) { false } })
                  }
                );
                if (parentRoles.size() > 0) {
                  approver1 := ?parentRoles[0].assignmentId;
                };
              };
            };
            switch (grandParentId) {
              case (null) {};
              case (?gpid) {
                let grandParentRoles = roleAssignments.values().toArray().filter(
                  func(ra) {
                    ra.activeStatus and
                    (switch (ra.orgNodeId) { case (?nid) { nid == gpid }; case (null) { false } })
                  }
                );
                if (grandParentRoles.size() > 0) {
                  approver2 := ?grandParentRoles[0].assignmentId;
                };
              };
            };
            (approver1, approver2);
          };
        };
      };
    };
  };

  public shared ({ caller }) func createCompany(companyName : Text, adminFullName : Text, email : ?Text) : async CompanyId {
    switch (getCallerUser(caller)) {
      case (?_) { Runtime.trap("Principal already registered in a company") };
      case (null) {};
    };

    let companyId = generateId();
    let company : Company = {
      companyId;
      companyName;
      activeStatus = #Active;
      createdAt = Time.now();
      createdBy = caller;
    };

    companies.add(companyId, company);

    let userId = generateId();
    let user : User = {
      userId;
      principalId = caller;
      companyId;
      fullName = adminFullName;
      emailAddress = email;
      registrationCodeUsed = null;
      status = #Active;
      createdAt = Time.now();
      createdBy = caller;
    };

    users.add(userId, user);

    let roleAssignmentId = generateId();
    let roleAssignment : RoleAssignment = {
      assignmentId = roleAssignmentId;
      userId;
      companyId;
      roleType = #CompanyAdmin;
      orgNodeId = null;
      activeStatus = true;
      ultimateParentId = null;
      grandParentId = null;
      parentId = null;
      assignedAt = Time.now();
      assignedBy = caller;
    };

    roleAssignments.add(roleAssignmentId, roleAssignment);

    logAudit(companyId, "Company", companyId, "CREATE", caller);
    logAudit(companyId, "User", userId, "CREATE", caller);
    logAudit(companyId, "RoleAssignment", roleAssignmentId, "ASSIGN_COMPANY_ADMIN", caller);

    companyId;
  };

  public query ({ caller }) func getMyProfile() : async ?MyProfile {
    let user = getCallerUser(caller);
    switch (user) {
      case (null) { null };
      case (?u) {
        ?{
          userId = u.userId;
          principalId = u.principalId;
          companyId = u.companyId;
          fullName = u.fullName;
          status = u.status;
          roles = getActiveRoleAssignments(u.userId);
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func generateRegistrationCode() : async RegistrationCode {
    let user = requireCompanyAdmin(caller);

    let code = generateId();
    let record : RegistrationCodeRecord = {
      code;
      companyId = user.companyId;
      isActive = true;
      createdAt = Time.now();
      createdBy = caller;
    };
    registrationCodes.add(code, record);

    logAudit(user.companyId, "RegistrationCode", code, "GENERATE", caller);
    code;
  };

  public query ({ caller }) func listRegistrationCodes() : async [RegistrationCodeRecord] {
    let user = requireCallerUser(caller);
    if (not isCompanyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only COMPANY_ADMIN can list registration codes");
    };

    registrationCodes.values().toArray().filter(
      func(r) { r.companyId == user.companyId }
    );
  };

  public shared ({ caller }) func deactivateRegistrationCode(code : Text) : async () {
    let user = requireCompanyAdmin(caller);

    switch (registrationCodes.get(code)) {
      case (null) { Runtime.trap("Registration code not found") };
      case (?record) {
        requireSameCompany(caller, record.companyId);
        let updated : RegistrationCodeRecord = {
          code = record.code;
          companyId = record.companyId;
          isActive = false;
          createdAt = record.createdAt;
          createdBy = record.createdBy;
        };
        registrationCodes.add(code, updated);
        logAudit(user.companyId, "RegistrationCode", code, "DEACTIVATE", caller);
      };
    };
  };

  public shared ({ caller }) func joinCompany(code : Text, fullName : Text, email : ?Text) : async CompanyId {
    switch (getCallerUser(caller)) {
      case (?_) { Runtime.trap("Principal already registered in a company") };
      case (null) {};
    };

    switch (registrationCodes.get(code)) {
      case (null) { Runtime.trap("Invalid registration code") };
      case (?record) {
        if (not record.isActive) {
          Runtime.trap("Registration code already used or deactivated");
        };

        switch (companies.get(record.companyId)) {
          case (null) { Runtime.trap("Company not found") };
          case (?_) {};
        };

        let userId = generateId();
        let user : User = {
          userId;
          principalId = caller;
          companyId = record.companyId;
          fullName;
          emailAddress = email;
          registrationCodeUsed = ?code;
          status = #Unassigned;
          createdAt = Time.now();
          createdBy = caller;
        };

        users.add(userId, user);

        let updated : RegistrationCodeRecord = {
          code = record.code;
          companyId = record.companyId;
          isActive = false;
          createdAt = record.createdAt;
          createdBy = record.createdBy;
        };
        registrationCodes.add(code, updated);

        logAudit(record.companyId, "User", userId, "JOIN_COMPANY", caller);
        logAudit(record.companyId, "RegistrationCode", code, "USE", caller);

        record.companyId;
      };
    };
  };

  public query ({ caller }) func listUsers() : async [User] {
    let user = requireCallerUser(caller);
    if (not isCompanyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only COMPANY_ADMIN can list users");
    };

    users.values().toArray().filter(
      func(u) { u.companyId == user.companyId }
    );
  };

  public shared ({ caller }) func updateUserStatus(userId : UserId, newStatus : Text) : async () {
    let adminUser = requireCompanyAdmin(caller);

    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?targetUser) {
        requireSameCompany(caller, targetUser.companyId);

        let status = switch (newStatus) {
          case ("UNASSIGNED") { #Unassigned };
          case ("ACTIVE") { #Active };
          case ("INACTIVE") { #Inactive };
          case (_) { Runtime.trap("Invalid status") };
        };

        if (status == #Inactive) {
          let roles = getActiveRoleAssignments(userId);
          let isAdmin = not roles.filter(func(r) { r.roleType == #CompanyAdmin }).isEmpty();
          if (isAdmin and countActiveCompanyAdmins(targetUser.companyId) <= 1) {
            Runtime.trap("Cannot deactivate the last active COMPANY_ADMIN");
          };
        };

        let updated : User = {
          userId = targetUser.userId;
          principalId = targetUser.principalId;
          companyId = targetUser.companyId;
          fullName = targetUser.fullName;
          emailAddress = targetUser.emailAddress;
          registrationCodeUsed = targetUser.registrationCodeUsed;
          status;
          createdAt = targetUser.createdAt;
          createdBy = targetUser.createdBy;
        };

        users.add(userId, updated);
        logAudit(adminUser.companyId, "User", userId, "UPDATE_STATUS:" # newStatus, caller);
      };
    };
  };

  public query ({ caller }) func getUserById(userId : UserId) : async ?User {
    let user = requireCallerUser(caller);
    if (not isCompanyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only COMPANY_ADMIN can get user by ID");
    };

    switch (users.get(userId)) {
      case (null) { null };
      case (?u) {
        if (u.companyId != user.companyId) {
          Runtime.trap("Unauthorized: Access denied to other company data");
        };
        ?u;
      };
    };
  };

  public shared ({ caller }) func createOrganizationNode(nodeType : Text, nodeName : Text, parentNodeId : ?Text) : async OrgNodeId {
    let user = requireCompanyAdmin(caller);

    let nodeTypeVariant = switch (nodeType) {
      case ("PRESIDENT_DIRECTOR") { #PresidentDirector };
      case ("DIRECTOR") { #Director };
      case ("DIVISION") { #Division };
      case ("DEPARTMENT") { #Department };
      case (_) { Runtime.trap("Invalid node type") };
    };

    switch (nodeTypeVariant) {
      case (#PresidentDirector) {
        switch (parentNodeId) {
          case (?_) { Runtime.trap("PRESIDENT_DIRECTOR cannot have a parent") };
          case (null) {};
        };
        let existing = orgNodes.values().toArray().filter(
          func(n) {
            n.companyId == user.companyId and n.nodeType == #PresidentDirector
          }
        );
        if (existing.size() > 0) {
          Runtime.trap("Only one PRESIDENT_DIRECTOR allowed per company");
        };
      };
      case (#Director) {
        switch (parentNodeId) {
          case (null) { Runtime.trap("DIRECTOR must have a PRESIDENT_DIRECTOR parent") };
          case (?pid) {
            switch (orgNodes.get(pid)) {
              case (null) { Runtime.trap("Parent node not found") };
              case (?parent) {
                if (parent.companyId != user.companyId) {
                  Runtime.trap("Parent node must be in same company");
                };
                if (parent.nodeType != #PresidentDirector) {
                  Runtime.trap("DIRECTOR parent must be PRESIDENT_DIRECTOR");
                };
              };
            };
          };
        };
      };
      case (#Division) {
        switch (parentNodeId) {
          case (null) { Runtime.trap("DIVISION must have a DIRECTOR parent") };
          case (?pid) {
            switch (orgNodes.get(pid)) {
              case (null) { Runtime.trap("Parent node not found") };
              case (?parent) {
                if (parent.companyId != user.companyId) {
                  Runtime.trap("Parent node must be in same company");
                };
                if (parent.nodeType != #Director) {
                  Runtime.trap("DIVISION parent must be DIRECTOR");
                };
              };
            };
          };
        };
      };
      case (#Department) {
        switch (parentNodeId) {
          case (null) { Runtime.trap("DEPARTMENT must have a DIVISION parent") };
          case (?pid) {
            switch (orgNodes.get(pid)) {
              case (null) { Runtime.trap("Parent node not found") };
              case (?parent) {
                if (parent.companyId != user.companyId) {
                  Runtime.trap("Parent node must be in same company");
                };
                if (parent.nodeType != #Division) {
                  Runtime.trap("DEPARTMENT parent must be DIVISION");
                };
              };
            };
          };
        };
      };
    };

    let nodeId = generateId();
    let orgNode : OrgNode = {
      nodeId;
      companyId = user.companyId;
      nodeType = nodeTypeVariant;
      nodeName;
      parentNodeId;
      createdAt = Time.now();
      createdBy = caller;
      updatedAt = Time.now();
      updatedBy = caller;
    };

    orgNodes.add(nodeId, orgNode);
    logAudit(user.companyId, "OrganizationNode", nodeId, "CREATE", caller);
    nodeId;
  };

  public shared ({ caller }) func updateOrganizationNode(nodeId : OrgNodeId, nodeName : Text) : async () {
    let user = requireCompanyAdmin(caller);

    switch (orgNodes.get(nodeId)) {
      case (null) { Runtime.trap("Organization node not found") };
      case (?node) {
        requireSameCompany(caller, node.companyId);

        let updated : OrgNode = {
          nodeId = node.nodeId;
          companyId = node.companyId;
          nodeType = node.nodeType;
          nodeName;
          parentNodeId = node.parentNodeId;
          createdAt = node.createdAt;
          createdBy = node.createdBy;
          updatedAt = Time.now();
          updatedBy = caller;
        };

        orgNodes.add(nodeId, updated);
        logAudit(user.companyId, "OrganizationNode", nodeId, "UPDATE", caller);
      };
    };
  };

  public query ({ caller }) func listOrganizationNodes() : async [OrgNode] {
    let user = requireCallerUser(caller);

    orgNodes.values().toArray().filter(
      func(n) { n.companyId == user.companyId }
    );
  };

  public shared ({ caller }) func assignRole(userId : UserId, roleType : Text, organizationNodeId : ?Text) : async () {
    let adminUser = requireCompanyAdmin(caller);

    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?targetUser) {
        requireSameCompany(caller, targetUser.companyId);

        let roleTypeVariant = switch (roleType) {
          case ("COMPANY_ADMIN") { #CompanyAdmin };
          case ("PRESIDENT_DIRECTOR") { #PresidentDirector };
          case ("DIRECTOR") { #Director };
          case ("DIVISION_HEAD") { #DivisionHead };
          case ("DEPARTMENT_HEAD") { #DepartmentHead };
          case (_) { Runtime.trap("Invalid role type") };
        };

        var hierarchy : (?Text, ?Text, ?Text) = (null, null, null);
        switch (organizationNodeId) {
          case (null) {
            if (roleTypeVariant != #CompanyAdmin) {
              Runtime.trap("Non-admin roles require an organization node");
            };
          };
          case (?nodeId) {
            switch (orgNodes.get(nodeId)) {
              case (null) { Runtime.trap("Organization node not found") };
              case (?node) {
                if (node.companyId != targetUser.companyId) {
                  Runtime.trap("Organization node must be in same company");
                };
                hierarchy := resolveHierarchy(nodeId);
              };
            };
          };
        };

        let assignmentId = generateId();
        let roleAssignment : RoleAssignment = {
          assignmentId;
          userId;
          companyId = targetUser.companyId;
          roleType = roleTypeVariant;
          orgNodeId = organizationNodeId;
          activeStatus = true;
          ultimateParentId = hierarchy.0;
          grandParentId = hierarchy.1;
          parentId = hierarchy.2;
          assignedAt = Time.now();
          assignedBy = caller;
        };

        roleAssignments.add(assignmentId, roleAssignment);
        logAudit(adminUser.companyId, "RoleAssignment", assignmentId, "ASSIGN:" # roleType, caller);
      };
    };
  };

  public shared ({ caller }) func deactivateRoleAssignment(assignmentId : RoleAssignmentId) : async () {
    let adminUser = requireCompanyAdmin(caller);

    switch (roleAssignments.get(assignmentId)) {
      case (null) { Runtime.trap("Role assignment not found") };
      case (?ra) {
        requireSameCompany(caller, ra.companyId);

        if (ra.roleType == #CompanyAdmin and ra.activeStatus) {
          if (countActiveCompanyAdmins(ra.companyId) <= 1) {
            Runtime.trap("Cannot deactivate the last active COMPANY_ADMIN");
          };
        };

        let updated : RoleAssignment = {
          assignmentId = ra.assignmentId;
          userId = ra.userId;
          companyId = ra.companyId;
          roleType = ra.roleType;
          orgNodeId = ra.orgNodeId;
          activeStatus = false;
          ultimateParentId = ra.ultimateParentId;
          grandParentId = ra.grandParentId;
          parentId = ra.parentId;
          assignedAt = ra.assignedAt;
          assignedBy = ra.assignedBy;
        };

        roleAssignments.add(assignmentId, updated);
        logAudit(adminUser.companyId, "RoleAssignment", assignmentId, "DEACTIVATE", caller);
      };
    };
  };

  public query ({ caller }) func listRoleAssignments(userId : ?UserId) : async [RoleAssignment] {
    let user = requireCallerUser(caller);
    if (not isCompanyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only COMPANY_ADMIN can list role assignments");
    };

    let filtered = roleAssignments.values().toArray().filter(
      func(ra) { ra.companyId == user.companyId }
    );

    switch (userId) {
      case (null) { filtered };
      case (?uid) {
        filtered.filter(func(ra) { ra.userId == uid });
      };
    };
  };

  public shared ({ caller }) func createKPIYear(year : Int) : async KPIYearId {
    let user = requireCompanyAdmin(caller);

    let kpiYearId = generateId();
    let kpiYear : KPIYear = {
      kpiYearId;
      companyId = user.companyId;
      year;
      status = #Open;
      createdAt = Time.now();
      createdBy = caller;
    };

    kpiYears.add(kpiYearId, kpiYear);
    logAudit(user.companyId, "KPIYear", kpiYearId, "CREATE", caller);
    kpiYearId;
  };

  public shared ({ caller }) func setKPIYearStatus(kpiYearId : KPIYearId, newStatus : Text) : async () {
    let user = requireCompanyAdmin(caller);

    switch (kpiYears.get(kpiYearId)) {
      case (null) { Runtime.trap("KPI Year not found") };
      case (?kpiYear) {
        requireSameCompany(caller, kpiYear.companyId);

        let status = switch (newStatus) {
          case ("OPEN") { #Open };
          case ("CLOSED") { #Closed };
          case (_) { Runtime.trap("Invalid status") };
        };

        let updated : KPIYear = {
          kpiYearId = kpiYear.kpiYearId;
          companyId = kpiYear.companyId;
          year = kpiYear.year;
          status;
          createdAt = kpiYear.createdAt;
          createdBy = kpiYear.createdBy;
        };

        kpiYears.add(kpiYearId, updated);
        logAudit(user.companyId, "KPIYear", kpiYearId, "SET_STATUS:" # newStatus, caller);
      };
    };
  };

  public query ({ caller }) func listKPIYears() : async [KPIYear] {
    let user = requireCallerUser(caller);

    kpiYears.values().toArray().filter(
      func(ky) { ky.companyId == user.companyId }
    );
  };

  public shared ({ caller }) func createBSCAspect(aspectName : Text) : async BSCAspectId {
    let user = requireCompanyAdmin(caller);

    let aspectId = generateId();
    let aspect : BSCAspect = {
      aspectId;
      companyId = user.companyId;
      aspectName;
      createdAt = Time.now();
      createdBy = caller;
    };

    bscAspects.add(aspectId, aspect);
    logAudit(user.companyId, "BSCAspect", aspectId, "CREATE", caller);
    aspectId;
  };

  public shared ({ caller }) func updateBSCAspect(aspectId : BSCAspectId, aspectName : Text) : async () {
    let user = requireCompanyAdmin(caller);

    switch (bscAspects.get(aspectId)) {
      case (null) { Runtime.trap("BSC Aspect not found") };
      case (?aspect) {
        requireSameCompany(caller, aspect.companyId);

        let updated : BSCAspect = {
          aspectId = aspect.aspectId;
          companyId = aspect.companyId;
          aspectName;
          createdAt = aspect.createdAt;
          createdBy = aspect.createdBy;
        };

        bscAspects.add(aspectId, updated);
        logAudit(user.companyId, "BSCAspect", aspectId, "UPDATE", caller);
      };
    };
  };

  public query ({ caller }) func listBSCAspects() : async [BSCAspect] {
    let user = requireCallerUser(caller);

    bscAspects.values().toArray().filter(
      func(a) { a.companyId == user.companyId }
    );
  };

  public shared ({ caller }) func createStrategicObjective(bscAspectId : BSCAspectId, objectiveName : Text) : async StrategicObjectiveId {
    let user = requireCompanyAdmin(caller);

    switch (bscAspects.get(bscAspectId)) {
      case (null) { Runtime.trap("BSC Aspect not found") };
      case (?aspect) {
        requireSameCompany(caller, aspect.companyId);

        let objectiveId = generateId();
        let objective : StrategicObjective = {
          objectiveId;
          companyId = user.companyId;
          bscAspectId;
          objectiveName;
          createdAt = Time.now();
          createdBy = caller;
        };

        strategicObjectives.add(objectiveId, objective);
        logAudit(user.companyId, "StrategicObjective", objectiveId, "CREATE", caller);
        objectiveId;
      };
    };
  };

  public shared ({ caller }) func updateStrategicObjective(objectiveId : StrategicObjectiveId, objectiveName : Text) : async () {
    let user = requireCompanyAdmin(caller);

    switch (strategicObjectives.get(objectiveId)) {
      case (null) { Runtime.trap("Strategic Objective not found") };
      case (?objective) {
        requireSameCompany(caller, objective.companyId);

        let updated : StrategicObjective = {
          objectiveId = objective.objectiveId;
          companyId = objective.companyId;
          bscAspectId = objective.bscAspectId;
          objectiveName;
          createdAt = objective.createdAt;
          createdBy = objective.createdBy;
        };

        strategicObjectives.add(objectiveId, updated);
        logAudit(user.companyId, "StrategicObjective", objectiveId, "UPDATE", caller);
      };
    };
  };

  public query ({ caller }) func listStrategicObjectives(bscAspectId : ?BSCAspectId) : async [StrategicObjective] {
    let user = requireCallerUser(caller);

    let filtered = strategicObjectives.values().toArray().filter(
      func(o) { o.companyId == user.companyId }
    );

    switch (bscAspectId) {
      case (null) { filtered };
      case (?aid) {
        filtered.filter(func(o) { o.bscAspectId == aid });
      };
    };
  };

  public shared ({ caller }) func createKPI(
    kpiYearId : Text,
    bscAspectId : Text,
    strategicObjectiveId : Text,
    organizationNodeId : Text,
    kpiMeasurement : Text,
    kpiScoreParameter : ?Text,
    kpiPeriod : Text,
    kpiWeight : Float
  ) : async KPIId {
    let user = requireActiveUser(caller);

    switch (kpiYears.get(kpiYearId)) {
      case (null) { Runtime.trap("KPI Year not found") };
      case (?year) {
        requireSameCompany(caller, year.companyId);
      };
    };

    switch (bscAspects.get(bscAspectId)) {
      case (null) { Runtime.trap("BSC Aspect not found") };
      case (?aspect) {
        requireSameCompany(caller, aspect.companyId);
      };
    };

    switch (strategicObjectives.get(strategicObjectiveId)) {
      case (null) { Runtime.trap("Strategic Objective not found") };
      case (?objective) {
        requireSameCompany(caller, objective.companyId);
      };
    };

    switch (orgNodes.get(organizationNodeId)) {
      case (null) { Runtime.trap("Organization Node not found") };
      case (?node) {
        requireSameCompany(caller, node.companyId);
      };
    };

    let userRoles = getActiveRoleAssignments(user.userId);
    let nodeRole = userRoles.find(
      func(r) {
        switch (r.orgNodeId) {
          case (null) { false };
          case (?nid) { nid == organizationNodeId };
        };
      }
    );

    switch (nodeRole) {
      case (null) { Runtime.trap("User does not have an active role assignment for this organization node") };
      case (?role) {
        let periodVariant = switch (kpiPeriod) {
          case ("ONETIME") { #OneTime };
          case ("ANNUAL") { #Annual };
          case ("MONTHLY") { #Monthly };
          case ("QUARTERLY") { #Quarterly };
          case ("SEMI_ANNUAL") { #SemiAnnual };
          case (_) { Runtime.trap("Invalid KPI period") };
        };

        let kpiId = generateId();
        let kpi : KPI = {
          kpiId;
          companyId = user.companyId;
          ownerRoleAssignmentId = role.assignmentId;
          organizationNodeId;
          approverUserId = null;
          kpiYearId;
          bscAspectId;
          strategicObjectiveId;
          kpiMeasurement;
          kpiPeriod = periodVariant;
          kpiWeight;
          kpiStatus = #Draft;
          revisionNotes = null;
          createdAt = Time.now();
          createdBy = caller;
          updatedAt = Time.now();
          updatedBy = caller;
        };

        kpis.add(kpiId, kpi);
        // Store score parameter separately to avoid stable type compatibility issues
        switch (kpiScoreParameter) {
          case (null) {};
          case (?sp) { kpiScoreParameters.add(kpiId, sp) };
        };
        logAudit(user.companyId, "KPI", kpiId, "CREATE", caller);
        kpiId;
      };
    };
  };

  public shared ({ caller }) func updateKPI(
    kpiId : KPIId,
    bscAspectId : Text,
    strategicObjectiveId : Text,
    kpiMeasurement : Text,
    kpiScoreParameter : ?Text,
    kpiPeriod : Text,
    kpiWeight : Float
  ) : async () {
    let user = requireActiveUser(caller);

    switch (kpis.get(kpiId)) {
      case (null) { Runtime.trap("KPI not found") };
      case (?kpi) {
        requireSameCompany(caller, kpi.companyId);

        if (kpi.kpiStatus != #Draft and kpi.kpiStatus != #Revised) {
          Runtime.trap("KPI can only be updated when in Draft or Revised status");
        };

        switch (roleAssignments.get(kpi.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId != user.userId) {
              Runtime.trap("Unauthorized: Only the KPI owner can update it");
            };
          };
        };

        switch (bscAspects.get(bscAspectId)) {
          case (null) { Runtime.trap("BSC Aspect not found") };
          case (?aspect) {
            requireSameCompany(caller, aspect.companyId);
          };
        };

        switch (strategicObjectives.get(strategicObjectiveId)) {
          case (null) { Runtime.trap("Strategic Objective not found") };
          case (?objective) {
            requireSameCompany(caller, objective.companyId);
          };
        };

        let periodVariant = switch (kpiPeriod) {
          case ("ONETIME") { #OneTime };
          case ("ANNUAL") { #Annual };
          case ("MONTHLY") { #Monthly };
          case ("QUARTERLY") { #Quarterly };
          case ("SEMI_ANNUAL") { #SemiAnnual };
          case (_) { Runtime.trap("Invalid KPI period") };
        };

        let updated : KPI = {
          kpiId = kpi.kpiId;
          companyId = kpi.companyId;
          ownerRoleAssignmentId = kpi.ownerRoleAssignmentId;
          organizationNodeId = kpi.organizationNodeId;
          approverUserId = kpi.approverUserId;
          kpiYearId = kpi.kpiYearId;
          bscAspectId;
          strategicObjectiveId;
          kpiMeasurement;
          kpiPeriod = periodVariant;
          kpiWeight;
          kpiStatus = kpi.kpiStatus;
          revisionNotes = kpi.revisionNotes;
          createdAt = kpi.createdAt;
          createdBy = kpi.createdBy;
          updatedAt = Time.now();
          updatedBy = caller;
        };

        kpis.add(kpiId, updated);
        // Store score parameter separately
        switch (kpiScoreParameter) {
          case (null) { kpiScoreParameters.remove(kpiId) };
          case (?sp) { kpiScoreParameters.add(kpiId, sp) };
        };
        logAudit(user.companyId, "KPI", kpiId, "UPDATE", caller);
      };
    };
  };

  public shared ({ caller }) func deleteKPI(kpiId : KPIId) : async () {
    let user = requireActiveUser(caller);

    switch (kpis.get(kpiId)) {
      case (null) { Runtime.trap("KPI not found") };
      case (?kpi) {
        requireSameCompany(caller, kpi.companyId);

        if (kpi.kpiStatus != #Draft and kpi.kpiStatus != #Revised) {
          Runtime.trap("KPI can only be deleted when in Draft or Revised status");
        };

        switch (roleAssignments.get(kpi.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId != user.userId) {
              Runtime.trap("Unauthorized: Only the KPI owner can delete it");
            };
          };
        };

        kpis.remove(kpiId);
        kpiScoreParameters.remove(kpiId);
        logAudit(user.companyId, "KPI", kpiId, "DELETE", caller);
      };
    };
  };

  public shared ({ caller }) func submitKPI(kpiId : KPIId) : async () {
    let user = requireActiveUser(caller);

    switch (kpis.get(kpiId)) {
      case (null) { Runtime.trap("KPI not found") };
      case (?kpi) {
        requireSameCompany(caller, kpi.companyId);

        switch (roleAssignments.get(kpi.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId != user.userId) {
              Runtime.trap("Unauthorized: Only the KPI owner can submit");
            };
          };
        };

        if (kpi.kpiStatus != #Draft and kpi.kpiStatus != #Revised) {
          Runtime.trap("KPI must be in DRAFT or REVISED status to submit");
        };

        var finalStatus : { #Draft; #Submitted; #Approved; #Revised } = #Submitted;
        switch (roleAssignments.get(kpi.ownerRoleAssignmentId)) {
          case (null) {};
          case (?ownerRole) {
            if (ownerRole.roleType == #PresidentDirector) {
              finalStatus := #Approved;
            };
          };
        };

        let updated : KPI = {
          kpiId = kpi.kpiId;
          companyId = kpi.companyId;
          ownerRoleAssignmentId = kpi.ownerRoleAssignmentId;
          organizationNodeId = kpi.organizationNodeId;
          approverUserId = if (finalStatus == #Approved) { ?user.userId } else { kpi.approverUserId };
          kpiYearId = kpi.kpiYearId;
          bscAspectId = kpi.bscAspectId;
          strategicObjectiveId = kpi.strategicObjectiveId;
          kpiMeasurement = kpi.kpiMeasurement;
          kpiPeriod = kpi.kpiPeriod;
          kpiWeight = kpi.kpiWeight;
          kpiStatus = finalStatus;
          revisionNotes = kpi.revisionNotes;
          createdAt = kpi.createdAt;
          createdBy = kpi.createdBy;
          updatedAt = Time.now();
          updatedBy = caller;
        };

        kpis.add(kpiId, updated);
        let action = if (finalStatus == #Approved) { "SUBMIT_AUTO_APPROVED" } else { "SUBMIT" };
        logAudit(user.companyId, "KPI", kpiId, action, caller);
      };
    };
  };

  public shared ({ caller }) func approveKPI(kpiId : KPIId) : async () {
    let user = requireActiveUser(caller);

    switch (kpis.get(kpiId)) {
      case (null) { Runtime.trap("KPI not found") };
      case (?kpi) {
        requireSameCompany(caller, kpi.companyId);

        if (kpi.kpiStatus != #Submitted) {
          Runtime.trap("KPI must be in SUBMITTED status to approve");
        };

        let userRoles = getActiveRoleAssignments(user.userId);
        let isAdmin = not userRoles.filter(func(r) { r.roleType == #CompanyAdmin }).isEmpty();

        if (not isAdmin) {
          switch (orgNodes.get(kpi.organizationNodeId)) {
            case (null) { Runtime.trap("Organization node not found") };
            case (?node) {
              var hasApprovalRight = false;
              switch (node.parentNodeId) {
                case (null) {};
                case (?parentId) {
                  let parentRoles = userRoles.filter(
                    func(r) {
                      switch (r.orgNodeId) {
                        case (null) { false };
                        case (?nid) { nid == parentId };
                      };
                    }
                  );
                  if (parentRoles.size() > 0) {
                    hasApprovalRight := true;
                  };
                };
              };
              if (not hasApprovalRight) {
                Runtime.trap("Unauthorized: User is not in approval hierarchy");
              };
            };
          };
        };

        let updated : KPI = {
          kpiId = kpi.kpiId;
          companyId = kpi.companyId;
          ownerRoleAssignmentId = kpi.ownerRoleAssignmentId;
          organizationNodeId = kpi.organizationNodeId;
          approverUserId = ?user.userId;
          kpiYearId = kpi.kpiYearId;
          bscAspectId = kpi.bscAspectId;
          strategicObjectiveId = kpi.strategicObjectiveId;
          kpiMeasurement = kpi.kpiMeasurement;
          kpiPeriod = kpi.kpiPeriod;
          kpiWeight = kpi.kpiWeight;
          kpiStatus = #Approved;
          revisionNotes = kpi.revisionNotes;
          createdAt = kpi.createdAt;
          createdBy = kpi.createdBy;
          updatedAt = Time.now();
          updatedBy = caller;
        };

        kpis.add(kpiId, updated);
        logAudit(user.companyId, "KPI", kpiId, "APPROVE", caller);
      };
    };
  };

  public shared ({ caller }) func rejectKPI(kpiId : KPIId, revisionNotes : Text) : async () {
    let user = requireActiveUser(caller);

    switch (kpis.get(kpiId)) {
      case (null) { Runtime.trap("KPI not found") };
      case (?kpi) {
        requireSameCompany(caller, kpi.companyId);

        if (kpi.kpiStatus != #Submitted) {
          Runtime.trap("KPI must be SUBMITTED to reject");
        };

        switch (roleAssignments.get(kpi.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId == user.userId) {
              Runtime.trap("Cannot reject your own KPI");
            };
          };
        };

        let userRoles = getActiveRoleAssignments(user.userId);
        let isAdmin = not userRoles.filter(func(r) { r.roleType == #CompanyAdmin }).isEmpty();

        if (not isAdmin) {
          switch (orgNodes.get(kpi.organizationNodeId)) {
            case (null) { Runtime.trap("Organization node not found") };
            case (?node) {
              var hasApprovalRight = false;
              switch (node.parentNodeId) {
                case (null) {};
                case (?parentId) {
                  let parentRoles = userRoles.filter(
                    func(r) {
                      switch (r.orgNodeId) {
                        case (null) { false };
                        case (?nid) { nid == parentId };
                      };
                    }
                  );
                  if (parentRoles.size() > 0) {
                    hasApprovalRight := true;
                  };
                };
              };
              if (not hasApprovalRight) {
                Runtime.trap("Unauthorized: User is not in approval hierarchy");
              };
            };
          };
        };

        let updated : KPI = {
          kpiId = kpi.kpiId;
          companyId = kpi.companyId;
          ownerRoleAssignmentId = kpi.ownerRoleAssignmentId;
          organizationNodeId = kpi.organizationNodeId;
          approverUserId = ?user.userId;
          kpiYearId = kpi.kpiYearId;
          bscAspectId = kpi.bscAspectId;
          strategicObjectiveId = kpi.strategicObjectiveId;
          kpiMeasurement = kpi.kpiMeasurement;
          kpiPeriod = kpi.kpiPeriod;
          kpiWeight = kpi.kpiWeight;
          kpiStatus = #Revised;
          revisionNotes = ?revisionNotes;
          createdAt = kpi.createdAt;
          createdBy = kpi.createdBy;
          updatedAt = Time.now();
          updatedBy = caller;
        };

        kpis.add(kpiId, updated);
        logAudit(user.companyId, "KPI", kpiId, "REJECT", caller);
      };
    };
  };

  public shared ({ caller }) func updateKPIProgress(kpiId : KPIId, periodIndex : Nat, achievement : Float, score : Float) : async () {
    let user = requireActiveUser(caller);

    switch (kpis.get(kpiId)) {
      case (null) { Runtime.trap("KPI not found") };
      case (?kpi) {
        requireSameCompany(caller, kpi.companyId);

        switch (roleAssignments.get(kpi.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId != user.userId) {
              Runtime.trap("Unauthorized: Only the KPI owner can update progress");
            };
          };
        };

        if (kpi.kpiStatus != #Approved) {
          Runtime.trap("KPI must be APPROVED to update progress");
        };

        switch (kpiYears.get(kpi.kpiYearId)) {
          case (null) { Runtime.trap("KPI Year not found") };
          case (?year) {
            if (year.status != #Open) {
              Runtime.trap("KPI Year must be OPEN to update progress");
            };
          };
        };

        // Upsert: remove existing progress for this kpiId+periodIndex before adding new
        let existingKey = kpiProgress.entries().toArray().find(
          func((_, p)) { p.kpiId == kpiId and p.periodIndex == periodIndex }
        );
        switch (existingKey) {
          case (?(existingId, _)) { kpiProgress.remove(existingId) };
          case (null) {};
        };

        let progressId = generateId();
        let progress : KPIProgress = {
          progressId;
          kpiId;
          periodIndex;
          achievement;
          score;
          updatedAt = Time.now();
          updatedBy = caller;
        };

        kpiProgress.add(progressId, progress);
        logAudit(user.companyId, "KPIProgress", progressId, "UPDATE", caller);
      };
    };
  };

  public shared ({ caller }) func saveKPITargets(kpiId : KPIId, targets : [(Nat, Float)]) : async () {
    let user = requireActiveUser(caller);

    switch (kpis.get(kpiId)) {
      case (null) { Runtime.trap("KPI not found") };
      case (?kpi) {
        requireSameCompany(caller, kpi.companyId);

        switch (roleAssignments.get(kpi.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId != user.userId) {
              Runtime.trap("Unauthorized: Only the KPI owner can save targets");
            };
          };
        };

        // Remove existing targets for this KPI
        let existing = kpiTargets.entries().toArray().filter(func((_, t)) { t.kpiId == kpiId });
        for ((existingId, _) in existing.vals()) {
          kpiTargets.remove(existingId);
        };

        // Add new targets — use a compound key (kpiId + "-period-" + periodIndex) as the
        // targetId instead of generateId(). The generateId() function uses Time.now() which
        // returns the SAME nanosecond timestamp for all iterations within a single message
        // execution on the IC, causing duplicate map keys and only the last target surviving.
        // A compound key based on kpiId and periodIndex is stable, unique, and deterministic.
        for ((periodIndex, targetValue) in targets.vals()) {
          let targetId = kpiId # "-period-" # periodIndex.toText();
          let target : KPITarget = {
            targetId;
            kpiId;
            periodIndex;
            targetValue;
          };
          kpiTargets.add(targetId, target);
        };

        logAudit(user.companyId, "KPITarget", kpiId, "SAVE_TARGETS", caller);
      };
    };
  };

  public query ({ caller }) func getKPITargets(kpiId : KPIId) : async [KPITarget] {
    let user = requireCallerUser(caller);

    switch (kpis.get(kpiId)) {
      case (null) { Runtime.trap("KPI not found") };
      case (?kpi) {
        if (kpi.companyId != user.companyId) {
          Runtime.trap("Unauthorized: Access denied to other company data");
        };
        kpiTargets.values().toArray().filter(func(t) { t.kpiId == kpiId });
      };
    };
  };

  public query ({ caller }) func getKPIScoreParameter(kpiId : KPIId) : async ?Text {
    let user = requireCallerUser(caller);
    switch (kpis.get(kpiId)) {
      case (null) { null };
      case (?kpi) {
        if (kpi.companyId != user.companyId) {
          Runtime.trap("Unauthorized: Access denied");
        };
        kpiScoreParameters.get(kpiId);
      };
    };
  };

  public query ({ caller }) func getKPIProgressList(kpiId : KPIId) : async [KPIProgress] {
    let user = requireCallerUser(caller);

    switch (kpis.get(kpiId)) {
      case (null) { Runtime.trap("KPI not found") };
      case (?kpi) {
        if (kpi.companyId != user.companyId) {
          Runtime.trap("Unauthorized: Access denied to other company data");
        };
        kpiProgress.values().toArray().filter(func(p) { p.kpiId == kpiId });
      };
    };
  };

  public query ({ caller }) func getKPI(kpiId : KPIId) : async ?KPI {
    let user = requireCallerUser(caller);

    switch (kpis.get(kpiId)) {
      case (null) { null };
      case (?kpi) {
        if (kpi.companyId != user.companyId) {
          Runtime.trap("Unauthorized: Access denied to other company data");
        };
        ?kpi;
      };
    };
  };

  public query ({ caller }) func listKPIs(kpiYearId : ?Text, organizationNodeId : ?Text, statusFilter : ?Text) : async [KPI] {
    let user = requireCallerUser(caller);

    var filtered = kpis.values().toArray().filter(
      func(k) { k.companyId == user.companyId }
    );

    switch (kpiYearId) {
      case (null) {};
      case (?yid) {
        filtered := filtered.filter(func(k) { k.kpiYearId == yid });
      };
    };

    switch (organizationNodeId) {
      case (null) {};
      case (?nid) {
        filtered := filtered.filter(func(k) { k.organizationNodeId == nid });
      };
    };

    switch (statusFilter) {
      case (null) {};
      case (?status) {
        let statusVariant = switch (status) {
          case ("DRAFT") { ?#Draft };
          case ("SUBMITTED") { ?#Submitted };
          case ("APPROVED") { ?#Approved };
          case ("REVISED") { ?#Revised };
          case (_) { null };
        };
        switch (statusVariant) {
          case (null) {};
          case (?sv) {
            filtered := filtered.filter(func(k) { k.kpiStatus == sv });
          };
        };
      };
    };

    filtered;
  };

  public shared ({ caller }) func createOKR(
    kpiYearId : Text,
    okrAspect : Text,
    objective : Text,
    keyResult : Text,
    targetValue : Float,
    initialTargetDate : Text
  ) : async OKRId {
    let user = requireActiveUser(caller);

    switch (kpiYears.get(kpiYearId)) {
      case (null) { Runtime.trap("KPI Year not found") };
      case (?year) {
        requireSameCompany(caller, year.companyId);
        if (year.status != #Open) {
          Runtime.trap("KPI Year must be OPEN to create OKR");
        };
      };
    };

    if (objective == "") { Runtime.trap("Objective is required") };
    if (keyResult == "") { Runtime.trap("Key Result is required") };

    let aspectVariant = switch (okrAspect) {
      case ("TOOLS") { #Tools };
      case ("PROCESS") { #Process };
      case ("PEOPLE") { #People };
      case (_) { Runtime.trap("Invalid OKR aspect") };
    };

    let userRoles = getActiveRoleAssignments(user.userId);
    let nonAdminRoles = userRoles.filter(func(r) { r.roleType != #CompanyAdmin });
    let ownerRole = switch (nonAdminRoles.find(func(r) { r.orgNodeId.isSome() })) {
      case (null) { Runtime.trap("User does not have an active role assignment for an organization node") };
      case (?role) { role };
    };

    let (approver1, approver2) = resolveOKRApprovalChain(user.userId);

    let okrId = generateId();
    let okr : OKR = {
      okrId;
      companyId = user.companyId;
      kpiYearId;
      ownerRoleAssignmentId = ownerRole.assignmentId;
      approver1RoleAssignmentId = approver1;
      approver2RoleAssignmentId = approver2;
      okrStatus = #Draft;
      okrAspect = aspectVariant;
      objective;
      keyResult;
      targetValue;
      initialTargetDate;
      revisedTargetDate = null;
      realization = #Backlog;
      notes = null;
      createdAt = Time.now();
      createdBy = caller;
    };

    okrs.add(okrId, okr);
    logAudit(user.companyId, "OKR", okrId, "CREATE", caller);
    okrId;
  };

  public shared ({ caller }) func updateOKR(
    okrId : OKRId,
    okrAspect : Text,
    objective : Text,
    keyResult : Text,
    targetValue : Float,
    initialTargetDate : Text,
    revisedTargetDate : ?Text
  ) : async () {
    let user = requireActiveUser(caller);

    switch (okrs.get(okrId)) {
      case (null) { Runtime.trap("OKR not found") };
      case (?okr) {
        requireSameCompany(caller, okr.companyId);

        switch (roleAssignments.get(okr.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId != user.userId) {
              Runtime.trap("Unauthorized: Only the OKR owner can update");
            };
          };
        };

        if (okr.okrStatus != #Draft and okr.okrStatus != #Revised) {
          Runtime.trap("OKR can only be updated when in DRAFT or REVISED status");
        };

        let aspectVariant = switch (okrAspect) {
          case ("TOOLS") { #Tools };
          case ("PROCESS") { #Process };
          case ("PEOPLE") { #People };
          case (_) { Runtime.trap("Invalid OKR aspect") };
        };

        let updated : OKR = {
          okrId = okr.okrId;
          companyId = okr.companyId;
          kpiYearId = okr.kpiYearId;
          ownerRoleAssignmentId = okr.ownerRoleAssignmentId;
          approver1RoleAssignmentId = okr.approver1RoleAssignmentId;
          approver2RoleAssignmentId = okr.approver2RoleAssignmentId;
          okrStatus = okr.okrStatus;
          okrAspect = aspectVariant;
          objective;
          keyResult;
          targetValue;
          initialTargetDate;
          revisedTargetDate;
          realization = okr.realization;
          notes = okr.notes;
          createdAt = okr.createdAt;
          createdBy = okr.createdBy;
        };

        okrs.add(okrId, updated);
        logAudit(user.companyId, "OKR", okrId, "UPDATE", caller);
      };
    };
  };

  public shared ({ caller }) func submitOKR(okrId : OKRId) : async () {
    let user = requireActiveUser(caller);

    switch (okrs.get(okrId)) {
      case (null) { Runtime.trap("OKR not found") };
      case (?okr) {
        requireSameCompany(caller, okr.companyId);

        switch (roleAssignments.get(okr.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId != user.userId) {
              Runtime.trap("Unauthorized: Only the OKR owner can submit");
            };
          };
        };

        if (okr.okrStatus != #Draft and okr.okrStatus != #Revised) {
          Runtime.trap("OKR must be in DRAFT or REVISED status to submit");
        };

        switch (kpiYears.get(okr.kpiYearId)) {
          case (null) { Runtime.trap("KPI Year not found") };
          case (?year) {
            if (year.status != #Open) {
              Runtime.trap("KPI Year must be OPEN to submit OKR");
            };
          };
        };

        if (okr.objective == "") { Runtime.trap("Objective is required") };
        if (okr.keyResult == "") { Runtime.trap("Key Result is required") };

        var finalOKRStatus : { #Draft; #Submitted; #Approved; #Revised; #Rejected } = #Submitted;
        switch (roleAssignments.get(okr.ownerRoleAssignmentId)) {
          case (null) {};
          case (?ownerRole) {
            if (ownerRole.roleType == #PresidentDirector) {
              finalOKRStatus := #Approved;
            };
          };
        };

        let updated : OKR = {
          okrId = okr.okrId;
          companyId = okr.companyId;
          kpiYearId = okr.kpiYearId;
          ownerRoleAssignmentId = okr.ownerRoleAssignmentId;
          approver1RoleAssignmentId = okr.approver1RoleAssignmentId;
          approver2RoleAssignmentId = okr.approver2RoleAssignmentId;
          okrStatus = finalOKRStatus;
          okrAspect = okr.okrAspect;
          objective = okr.objective;
          keyResult = okr.keyResult;
          targetValue = okr.targetValue;
          initialTargetDate = okr.initialTargetDate;
          revisedTargetDate = okr.revisedTargetDate;
          realization = okr.realization;
          notes = okr.notes;
          createdAt = okr.createdAt;
          createdBy = okr.createdBy;
        };

        okrs.add(okrId, updated);
        let okrAction = if (finalOKRStatus == #Approved) { "SUBMIT_AUTO_APPROVED" } else { "SUBMIT" };
        logAudit(user.companyId, "OKR", okrId, okrAction, caller);
      };
    };
  };

  public shared ({ caller }) func approveOKR(okrId : OKRId) : async () {
    let user = requireActiveUser(caller);

    switch (okrs.get(okrId)) {
      case (null) { Runtime.trap("OKR not found") };
      case (?okr) {
        requireSameCompany(caller, okr.companyId);

        if (okr.okrStatus != #Submitted) {
          Runtime.trap("OKR must be in SUBMITTED status to approve");
        };

        switch (roleAssignments.get(okr.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId == user.userId) {
              Runtime.trap("Cannot approve your own OKR");
            };
          };
        };

        let callerRoles = getActiveRoleAssignments(user.userId);
        var isApprover = false;
        switch (okr.approver1RoleAssignmentId) {
          case (null) {};
          case (?a1id) {
            if (callerRoles.find(func(r) { r.assignmentId == a1id }) != null) {
              isApprover := true;
            };
          };
        };
        switch (okr.approver2RoleAssignmentId) {
          case (null) {};
          case (?a2id) {
            if (callerRoles.find(func(r) { r.assignmentId == a2id }) != null) {
              isApprover := true;
            };
          };
        };
        if (not isApprover) {
          Runtime.trap("Unauthorized: Not in approval chain for this OKR");
        };

        let updated : OKR = {
          okrId = okr.okrId;
          companyId = okr.companyId;
          kpiYearId = okr.kpiYearId;
          ownerRoleAssignmentId = okr.ownerRoleAssignmentId;
          approver1RoleAssignmentId = okr.approver1RoleAssignmentId;
          approver2RoleAssignmentId = okr.approver2RoleAssignmentId;
          okrStatus = #Approved;
          okrAspect = okr.okrAspect;
          objective = okr.objective;
          keyResult = okr.keyResult;
          targetValue = okr.targetValue;
          initialTargetDate = okr.initialTargetDate;
          revisedTargetDate = okr.revisedTargetDate;
          realization = okr.realization;
          notes = okr.notes;
          createdAt = okr.createdAt;
          createdBy = okr.createdBy;
        };

        okrs.add(okrId, updated);
        logAudit(user.companyId, "OKR", okrId, "APPROVE", caller);
      };
    };
  };

  public shared ({ caller }) func rejectOKR(okrId : OKRId, revisionNotes : Text) : async () {
    let user = requireActiveUser(caller);

    switch (okrs.get(okrId)) {
      case (null) { Runtime.trap("OKR not found") };
      case (?okr) {
        requireSameCompany(caller, okr.companyId);

        if (okr.okrStatus != #Submitted) {
          Runtime.trap("OKR must be in SUBMITTED status to reject");
        };

        switch (roleAssignments.get(okr.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId == user.userId) {
              Runtime.trap("Cannot reject your own OKR");
            };
          };
        };

        let callerRoles = getActiveRoleAssignments(user.userId);
        var isApprover = false;
        switch (okr.approver1RoleAssignmentId) {
          case (null) {};
          case (?a1id) {
            if (callerRoles.find(func(r) { r.assignmentId == a1id }) != null) {
              isApprover := true;
            };
          };
        };
        switch (okr.approver2RoleAssignmentId) {
          case (null) {};
          case (?a2id) {
            if (callerRoles.find(func(r) { r.assignmentId == a2id }) != null) {
              isApprover := true;
            };
          };
        };
        if (not isApprover) {
          Runtime.trap("Unauthorized: Not in approval chain for this OKR");
        };

        let updated : OKR = {
          okrId = okr.okrId;
          companyId = okr.companyId;
          kpiYearId = okr.kpiYearId;
          ownerRoleAssignmentId = okr.ownerRoleAssignmentId;
          approver1RoleAssignmentId = okr.approver1RoleAssignmentId;
          approver2RoleAssignmentId = okr.approver2RoleAssignmentId;
          okrStatus = #Revised;
          okrAspect = okr.okrAspect;
          objective = okr.objective;
          keyResult = okr.keyResult;
          targetValue = okr.targetValue;
          initialTargetDate = okr.initialTargetDate;
          revisedTargetDate = okr.revisedTargetDate;
          realization = okr.realization;
          notes = ?revisionNotes;
          createdAt = okr.createdAt;
          createdBy = okr.createdBy;
        };

        okrs.add(okrId, updated);
        logAudit(user.companyId, "OKR", okrId, "REJECT", caller);
      };
    };
  };

  public shared ({ caller }) func updateOKRProgress(okrId : OKRId, realization : Text, notes : ?Text) : async () {
    let user = requireActiveUser(caller);

    switch (okrs.get(okrId)) {
      case (null) { Runtime.trap("OKR not found") };
      case (?okr) {
        requireSameCompany(caller, okr.companyId);

        switch (roleAssignments.get(okr.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId != user.userId) {
              Runtime.trap("Unauthorized: Only the OKR owner can update progress");
            };
          };
        };

        if (okr.okrStatus != #Approved) {
          Runtime.trap("OKR must be APPROVED to update progress");
        };

        switch (kpiYears.get(okr.kpiYearId)) {
          case (null) { Runtime.trap("KPI Year not found") };
          case (?year) {
            if (year.status != #Open) {
              Runtime.trap("KPI Year must be OPEN to update OKR progress");
            };
          };
        };

        let realizationVariant = switch (realization) {
          case ("BACKLOG") { #Backlog };
          case ("ON_PROGRESS") { #OnProgress };
          case ("PENDING") { #Pending };
          case ("DONE") { #Done };
          case ("CARRIED_FOR_NEXT_YEAR") { #CarriedForNextYear };
          case (_) { Runtime.trap("Invalid realization value") };
        };

        let updated : OKR = {
          okrId = okr.okrId;
          companyId = okr.companyId;
          kpiYearId = okr.kpiYearId;
          ownerRoleAssignmentId = okr.ownerRoleAssignmentId;
          approver1RoleAssignmentId = okr.approver1RoleAssignmentId;
          approver2RoleAssignmentId = okr.approver2RoleAssignmentId;
          okrStatus = okr.okrStatus;
          okrAspect = okr.okrAspect;
          objective = okr.objective;
          keyResult = okr.keyResult;
          targetValue = okr.targetValue;
          initialTargetDate = okr.initialTargetDate;
          revisedTargetDate = okr.revisedTargetDate;
          realization = realizationVariant;
          notes;
          createdAt = okr.createdAt;
          createdBy = okr.createdBy;
        };

        okrs.add(okrId, updated);
        logAudit(user.companyId, "OKR", okrId, "UPDATE_PROGRESS", caller);
      };
    };
  };

  public shared ({ caller }) func deleteOKR(okrId : OKRId) : async () {
    let user = requireActiveUser(caller);

    switch (okrs.get(okrId)) {
      case (null) { Runtime.trap("OKR not found") };
      case (?okr) {
        requireSameCompany(caller, okr.companyId);

        switch (roleAssignments.get(okr.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId != user.userId) {
              Runtime.trap("Unauthorized: Only the OKR owner can delete");
            };
          };
        };

        if (okr.okrStatus != #Draft and okr.okrStatus != #Revised) {
          Runtime.trap("OKR can only be deleted when in DRAFT or REVISED status");
        };

        okrs.remove(okrId);
        logAudit(user.companyId, "OKR", okrId, "DELETE", caller);
      };
    };
  };

  public query ({ caller }) func getOKR(okrId : OKRId) : async ?OKR {
    let user = requireCallerUser(caller);

    switch (okrs.get(okrId)) {
      case (null) { null };
      case (?okr) {
        if (okr.companyId != user.companyId) {
          Runtime.trap("Unauthorized: Access denied to other company data");
        };
        ?okr;
      };
    };
  };

  public query ({ caller }) func listOKRs(kpiYearId : ?Text, statusFilter : ?Text) : async [OKR] {
    let user = requireCallerUser(caller);

    var filtered = okrs.values().toArray().filter(
      func(o) { o.companyId == user.companyId }
    );

    switch (kpiYearId) {
      case (null) {};
      case (?yid) {
        filtered := filtered.filter(func(o) { o.kpiYearId == yid });
      };
    };

    switch (statusFilter) {
      case (null) {};
      case (?status) {
        let statusVariant = switch (status) {
          case ("DRAFT") { ?#Draft };
          case ("SUBMITTED") { ?#Submitted };
          case ("APPROVED") { ?#Approved };
          case ("REVISED") { ?#Revised };
          case ("REJECTED") { ?#Rejected };
          case (_) { null };
        };
        switch (statusVariant) {
          case (null) {};
          case (?sv) {
            filtered := filtered.filter(func(o) { o.okrStatus == sv });
          };
        };
      };
    };

    filtered;
  };

  public query ({ caller }) func getAuditLogs(entityType : ?Text, entityId : ?Text) : async [AuditLog] {
    let user = requireCallerUser(caller);
    if (not isCompanyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only COMPANY_ADMIN can view audit logs");
    };

    var filtered = auditLogs.values().toArray().filter(
      func(log) { log.companyId == user.companyId }
    );

    switch (entityType) {
      case (null) {};
      case (?et) {
        filtered := filtered.filter(func(log) { log.entityType == et });
      };
    };

    switch (entityId) {
      case (null) {};
      case (?eid) {
        filtered := filtered.filter(func(log) { log.entityId == eid });
      };
    };

    filtered;
  };


  public shared ({ caller }) func updateOKRProgressWithDate(
    okrId : OKRId,
    realization : Text,
    notes : ?Text,
    revisedTargetDate : ?Text,
  ) : async () {
    let user = requireActiveUser(caller);

    switch (okrs.get(okrId)) {
      case (null) { Runtime.trap("OKR not found") };
      case (?okr) {
        requireSameCompany(caller, okr.companyId);

        switch (roleAssignments.get(okr.ownerRoleAssignmentId)) {
          case (null) { Runtime.trap("Owner role assignment not found") };
          case (?ownerRole) {
            if (ownerRole.userId != user.userId) {
              Runtime.trap("Unauthorized: Only the OKR owner can update progress");
            };
          };
        };

        if (okr.okrStatus != #Approved) {
          Runtime.trap("OKR must be APPROVED to update progress");
        };

        switch (kpiYears.get(okr.kpiYearId)) {
          case (null) { Runtime.trap("KPI Year not found") };
          case (?year) {
            if (year.status != #Open) {
              Runtime.trap("KPI Year must be OPEN to update OKR progress");
            };
          };
        };

        let realizationVariant = switch (realization) {
          case ("BACKLOG") { #Backlog };
          case ("ON_PROGRESS") { #OnProgress };
          case ("PENDING") { #Pending };
          case ("DONE") { #Done };
          case ("CARRIED_FOR_NEXT_YEAR") { #CarriedForNextYear };
          case (_) { Runtime.trap("Invalid realization value") };
        };

        let newRevisedTargetDate : ?Text = switch (revisedTargetDate) {
          case (null) { okr.revisedTargetDate };
          case (?d) {
            if (d == "") { okr.revisedTargetDate }
            else { ?d }
          };
        };

        let updated : OKR = {
          okrId = okr.okrId;
          companyId = okr.companyId;
          kpiYearId = okr.kpiYearId;
          ownerRoleAssignmentId = okr.ownerRoleAssignmentId;
          approver1RoleAssignmentId = okr.approver1RoleAssignmentId;
          approver2RoleAssignmentId = okr.approver2RoleAssignmentId;
          okrStatus = okr.okrStatus;
          okrAspect = okr.okrAspect;
          objective = okr.objective;
          keyResult = okr.keyResult;
          targetValue = okr.targetValue;
          initialTargetDate = okr.initialTargetDate;
          revisedTargetDate = newRevisedTargetDate;
          realization = realizationVariant;
          notes;
          createdAt = okr.createdAt;
          createdBy = okr.createdBy;
        };

        okrs.add(okrId, updated);
        logAudit(user.companyId, "OKR", okrId, "UPDATE_PROGRESS", caller);
      };
    };
  };

};
