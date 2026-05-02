import { pgTable, serial, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export type QuizAnswerData = {
  skinType: string;
  concerns: string[];
  ageRange: string;
  dailyTime: string;
  budget: string;
};

export type QuizRecommendationData = {
  productId: number;
  reason: string;
};

export const quizResultsTable = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  answers: json("answers").$type<QuizAnswerData>().notNull(),
  recommendations: json("recommendations").$type<QuizRecommendationData[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuizResultSchema = createInsertSchema(quizResultsTable).omit({ id: true, createdAt: true });
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResultsTable.$inferSelect;
