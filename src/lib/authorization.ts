import "server-only";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "./routeAccess";

type SessionUser = {
  id: string;
  role: UserRole;
  username?: string | null;
  name?: string | null;
  email?: string | null;
};

function hasAllowedRole(
  role: string | undefined,
  allowedRoles?: readonly UserRole[]
): role is UserRole {
  return Boolean(role && (!allowedRoles || allowedRoles.includes(role as UserRole)));
}

export async function requirePageUser(
  allowedRoles?: readonly UserRole[]
): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/sign-in");
  }

  if (!hasAllowedRole(user.role, allowedRoles)) {
    redirect("/");
  }

  return user as SessionUser;
}

export async function requireActionUser(
  allowedRoles?: readonly UserRole[]
): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!hasAllowedRole(user.role, allowedRoles)) {
    throw new Error("Forbidden");
  }

  return user as SessionUser;
}
