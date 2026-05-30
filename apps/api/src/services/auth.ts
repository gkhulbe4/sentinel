import bcrypt from "bcryptjs";
import type { PrismaClient } from "@sentinel/db";
import { httpError } from "../lib/errors";

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: string;
  email: string;
}

export async function signup(
  prisma: PrismaClient,
  email: string,
  password: string,
): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw httpError.conflict("Email already registered", "EMAIL_TAKEN");
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.user.create({
    data: { email, password: hash },
    select: { id: true, email: true },
  });
}

export async function login(
  prisma: PrismaClient,
  email: string,
  password: string,
): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Compare against a dummy hash when the user is missing to blunt timing leaks.
  const hash = user?.password ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) throw httpError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  return { id: user.id, email: user.email };
}
