-- Accounts removed: no login, registration, personal dashboard, or API keys.
-- Stats stay reachable purely via Link.secretToken, without any owner concept.

-- DropForeignKey
ALTER TABLE "Link" DROP CONSTRAINT "Link_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_ownerId_fkey";

-- DropTable
DROP TABLE "ApiKey";

-- DropTable
DROP TABLE "User";

-- DropIndex
DROP INDEX "Link_ownerId_idx";

-- AlterTable
ALTER TABLE "Link" DROP COLUMN "ownerId";

-- DropEnum
DROP TYPE "Role";
