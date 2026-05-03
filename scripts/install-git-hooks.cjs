/**
 * מגדיר core.hooksPath ל-.githooks (דחיפה אוטומטית אחרי commit).
 * רץ מ-package.json "prepare" — נכשל בשקט אם אין git.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const hookFile = path.join(root, ".githooks", "post-commit");

if (!fs.existsSync(path.join(root, ".git")) || !fs.existsSync(hookFile)) {
  process.exit(0);
}

function gitExecutable() {
  if (process.env.GIT_EXE_PATH && fs.existsSync(process.env.GIT_EXE_PATH)) {
    return process.env.GIT_EXE_PATH;
  }
  const winDefault = path.join(process.env.ProgramFiles || "C:\\Program Files", "Git", "bin", "git.exe");
  if (process.platform === "win32" && fs.existsSync(winDefault)) {
    return winDefault;
  }
  return "git";
}

try {
  execFileSync(gitExecutable(), ["config", "core.hooksPath", ".githooks"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  console.log("[git-hooks] מופעל: אחרי כל commit ב-main מתבצע push אוטומטי (SKIP_AUTO_PUSH=1 לביטול חד-פעמי).");
} catch {
  // אין git ב-PATH או לא ריפו — לא לשבור npm install
}
