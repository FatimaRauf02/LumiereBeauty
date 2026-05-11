import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function updateAdmin() {
  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash("Bella_chaO?99", 10);
    await client.query(
      `UPDATE users SET password = $1 WHERE email = $2`,
      [hashedPassword, "admin@lumierebeauty.com"]
    );
    console.log("✅ Admin password updated successfully!");
    console.log("   Email: admin@lumierebeauty.com");
    console.log("   Password: Bella_chaO?99");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateAdmin();