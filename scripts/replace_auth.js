/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');
const files = [];

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
    }
}
walk(root);

for (const file of files) {
    let s = fs.readFileSync(file, 'utf8');
    const original = s;

    s = s.replace(/import\s*\{\s*auth\s*\}\s*from\s*"@clerk\/nextjs\/server";/g, 'import { auth } from "@/auth";');
    s = s.replace(/import\s*\{\s*currentUser\s*\}\s*from\s*"@clerk\/nextjs\/server";/g, 'import { auth } from "@/auth";');
    s = s.replace(/import\s*\{\s*UserButton\s*\}\s*from\s*"@clerk\/nextjs";/g, '');
    s = s.replace(/import\s*\{\s*useUser\s*\}\s*from\s*"@clerk\/nextjs";/g, '');
    s = s.replace(/const \{\s*userId,\s*sessionClaims\s*\}\s*=\s*await auth\(\);\s*\n\s*const role = \(sessionClaims\?\.metadata as \{ role\?: string \}\)\?\.role;/g, 'const session = await auth();\n  const userId = session?.user?.id;\n  const role = session?.user?.role;');
    s = s.replace(/const \{\s*sessionClaims\s*\}\s*=\s*await auth\(\);\s*\n\s*const role = \(sessionClaims\?\.metadata as \{ role\?: string \}\)\?\.role;/g, 'const session = await auth();\n  const role = session?.user?.role;');
    s = s.replace(/const \{\s*userId\s*\}\s*=\s*await auth\(\);\s*\n\s*/g, 'const session = await auth();\n  const userId = session?.user?.id;\n');
    s = s.replace(/const \{\s*userId\s*\}\s*=\s*await auth\(\);/g, 'const session = await auth();\n  const userId = session?.user?.id;');
    s = s.replace(/const \{\s*sessionClaims\s*\}\s*=\s*await auth\(\);/g, 'const session = await auth();');
    s = s.replace(/const \{\s*userId,\s*sessionClaims\s*\}\s*=\s*await auth\(\);/g, 'const session = await auth();\n  const userId = session?.user?.id;');
    s = s.replace(/const role = \(sessionClaims\?\.metadata as \{ role\?: string \}\)\?\.role;/g, 'const role = session?.user?.role;');

    if (s !== original) {
        fs.writeFileSync(file, s, 'utf8');
    }
}

const actions = path.join(root, 'lib', 'actions.ts');
let actionsText = fs.readFileSync(actions, 'utf8');
actionsText = actionsText.replace(/import\s*\{\s*clerkClient\s*\}\s*from\s*"@clerk\/nextjs\/server";\n/g, '');
actionsText = actionsText.replace(/\n\s*const client = await clerkClient\(\);\n\s*const user = await client\.users\.createUser\(\{\n\s*username: data\.username,\n\s*password: data\.password,\n\s*firstName: data\.name,\n\s*lastName: data\.surname,\n\s*publicMetadata: \{ role: "teacher" \},\n\s*\}\);\n\n\s*await prisma\.teacher\.create\(\{\n\s*data: \{\n\s*id: user\.id,/g, '\n    await prisma.teacher.create({\n      data: {\n        id: data.username,');
actionsText = actionsText.replace(/\n\s*const client = await clerkClient\(\);\n\s*await client\.users\.updateUser\(data\.id, \{\n\s*username: data\.username,\n\s*\.\.\.\(data\.password !== "" && \{ password: data\.password \}\),\n\s*firstName: data\.name,\n\s*lastName: data\.surname,\n\s*\}\);\n\n\s*await prisma\.teacher\.update\(/g, '\n    await prisma.teacher.update({');
actionsText = actionsText.replace(/\n\s*const client = await clerkClient\(\);\n\s*await client\.users\.deleteUser\(id\);\n\n\s*await prisma\.teacher\.delete\(/g, '\n    await prisma.teacher.delete({');
actionsText = actionsText.replace(/\n\s*const client = await clerkClient\(\);\n\s*const user = await client\.users\.createUser\(\{\n\s*username: data\.username,\n\s*password: data\.password,\n\s*firstName: data\.name,\n\s*lastName: data\.surname,\n\s*publicMetadata: \{ role: "student" \},\n\s*\}\);\n\n\s*await prisma\.student\.create\(\{\n\s*data: \{\n\s*id: user\.id,/g, '\n    await prisma.student.create({\n      data: {\n        id: data.username,');
actionsText = actionsText.replace(/\n\s*const client = await clerkClient\(\);\n\s*await client\.users\.updateUser\(data\.id, \{\n\s*username: data\.username,\n\s*\.\.\.\(data\.password !== "" && \{ password: data\.password \}\),\n\s*firstName: data\.name,\n\s*lastName: data\.surname,\n\s*\}\);\n\n\s*await prisma\.student\.update\(/g, '\n    await prisma.student.update({');
actionsText = actionsText.replace(/\n\s*const client = await clerkClient\(\);\n\s*await client\.users\.deleteUser\(id\);\n\n\s*await prisma\.student\.delete\(/g, '\n    await prisma.student.delete({');
fs.writeFileSync(actions, actionsText, 'utf8');

console.log('Auth migration cleanup executed.');
