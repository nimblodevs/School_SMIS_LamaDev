export const roles = ["admin", "teacher", "student", "parent"] as const;

export type UserRole = (typeof roles)[number];

const listRouteRoles: Record<string, readonly UserRole[]> = {
  teachers: ["admin", "teacher"],
  students: ["admin", "teacher"],
  parents: ["admin", "teacher"],
  subjects: ["admin"],
  classes: ["admin", "teacher"],
  lessons: ["admin", "teacher"],
  exams: roles,
  assignments: roles,
  results: roles,
  attendance: roles,
  events: roles,
  announcements: roles,
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && roles.includes(value as UserRole);
}

export function allowedRolesForPath(pathname: string): readonly UserRole[] | null {
  const [firstSegment, secondSegment] = pathname.split("/").filter(Boolean);

  if (firstSegment === "list") {
    return listRouteRoles[secondSegment] ?? roles;
  }

  if (isUserRole(firstSegment)) {
    return [firstSegment];
  }

  return null;
}

export function homePathForRole(role: UserRole): string {
  return `/${role}`;
}
