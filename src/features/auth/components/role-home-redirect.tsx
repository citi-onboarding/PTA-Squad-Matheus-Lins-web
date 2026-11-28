import { Navigate } from "react-router-dom";

import { useSession } from "../hooks/use-session";
import { homePathFor } from "../lib/role-access";

/** Sends `/` to the home page of the signed-in user's role. */
export function RoleHomeRedirect() {
  const { data: user } = useSession();
  if (!user) return null;
  return <Navigate to={homePathFor(user.role)} replace />;
}
