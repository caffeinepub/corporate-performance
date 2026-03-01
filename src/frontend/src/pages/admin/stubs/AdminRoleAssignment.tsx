import { UserCheck } from "lucide-react";
import StubPage from "../../../components/StubPage";

export default function AdminRoleAssignment() {
  return (
    <StubPage
      title="Role Assignment"
      description="Assign organizational roles to registered users and manage multi-role configurations."
      icon={UserCheck}
    />
  );
}
