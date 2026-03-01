import { Users } from "lucide-react";
import StubPage from "../../../components/StubPage";

export default function AdminUsers() {
  return (
    <StubPage
      title="Users"
      description="View and manage all registered users in your organization, including their status and role assignments."
      icon={Users}
    />
  );
}
