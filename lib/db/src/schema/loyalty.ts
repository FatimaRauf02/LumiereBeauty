import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const loyaltyTable = pgTable("loyalty_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  points: integer("points").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  totalRedeemed: integer("total_redeemed").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Loyalty = typeof loyaltyTable.$inferSelect;
