import assert from "node:assert/strict";
import test from "node:test";
import {
  allowedRolesForPath,
  homePathForRole,
  isUserRole,
} from "../src/lib/routeAccess.ts";

test("protects list routes with the intended roles", () => {
  assert.deepEqual(allowedRolesForPath("/list/subjects"), ["admin"]);
  assert.deepEqual(allowedRolesForPath("/list/students/abc"), [
    "admin",
    "teacher",
  ]);
  assert.deepEqual(allowedRolesForPath("/list/results"), [
    "admin",
    "teacher",
    "student",
    "parent",
  ]);
});

test("protects each role dashboard from other roles", () => {
  assert.deepEqual(allowedRolesForPath("/admin"), ["admin"]);
  assert.deepEqual(allowedRolesForPath("/teacher/calendar"), ["teacher"]);
  assert.equal(allowedRolesForPath("/sign-in"), null);
});

test("accepts only known roles and builds role home paths", () => {
  assert.equal(isUserRole("parent"), true);
  assert.equal(isUserRole("owner"), false);
  assert.equal(homePathForRole("student"), "/student");
});
