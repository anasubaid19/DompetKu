import { expect, test } from "bun:test"

test("initializes Better Auth tables for a new database", async () => {
  const child = Bun.spawn(
    [
      "bun",
      "-e",
      `
        await import("./src/lib/auth.ts")
        const { db } = await import("./src/lib/db.ts")
        const tables = db
          .query("SELECT name FROM sqlite_master WHERE type = ? AND name IN (?, ?, ?, ?) ORDER BY name")
          .all("table", "user", "session", "account", "verification")
          .map(({ name }) => name)
        console.log(JSON.stringify(tables))
      `,
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
        DATABASE_PATH: ":memory:",
      },
      stderr: "pipe",
      stdout: "pipe",
    },
  )

  const [exitCode, stderr, stdout] = await Promise.all([
    child.exited,
    new Response(child.stderr).text(),
    new Response(child.stdout).text(),
  ])

  expect(stderr).toBe("")
  expect(exitCode).toBe(0)
  expect(JSON.parse(stdout)).toEqual(["account", "session", "user", "verification"])
})
