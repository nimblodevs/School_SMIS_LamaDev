import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { unstable_rethrow } from "next/navigation";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/sign-in",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const username = credentials?.username?.trim();
                const password = credentials?.password;

                if (!username || !password) {
                    return null;
                }

                const user = await prisma.user.findUnique({ where: { username } });
                if (user) {
                    const isValid = await bcrypt.compare(password, user.password);
                    if (!isValid) {
                        return null;
                    }

                    return {
                        id: user.id,
                        name: user.name,
                        username: user.username,
                        role: user.role.toLowerCase(),
                    };
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const nextUser = user as typeof user & { role?: string; username?: string };
                token.id = nextUser.id;
                token.role = nextUser.role;
                token.username = nextUser.username;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.username = token.username as string | undefined;
            }

            return session;
        },
    },
};

export async function auth() {
    try {
        return await getServerSession(authOptions);
    } catch (error) {
        unstable_rethrow(error);
        console.warn("Invalid or stale NextAuth session detected. Falling back to an unauthenticated state.", error);
        return null;
    }
}
