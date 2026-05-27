import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { promoCodesTable } from "./promo_codes";

export const promoCodeUsesTable = pgTable(
  "promo_code_uses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    promoCodeId: uuid("promo_code_id")
      .notNull()
      .references(() => promoCodesTable.id, { onDelete: "cascade" }),
    usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("promo_code_uses_user_code_unique").on(table.userId, table.promoCodeId)],
);

export type PromoCodeUse = typeof promoCodeUsesTable.$inferSelect;
