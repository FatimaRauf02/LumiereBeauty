import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 20 }).notNull(),
  refereeId: integer("referee_id").unique().references(() => usersTable.id, { onDelete: "set null" }),
  bonusAwardedAt: timestamp("bonus_awarded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Referral = typeof referralsTable.$inferSelect;
