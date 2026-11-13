-- CreateEnum
CREATE TYPE "link_kind" AS ENUM ('GITHUB', 'LINKEDIN', 'TELEGRAM', 'EMAIL', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "skill_category" AS ENUM ('LANGUAGE', 'BACKEND', 'DATABASE', 'API', 'INFRASTRUCTURE', 'TESTING', 'TOOLING', 'PRACTICE');

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_links" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "kind" "link_kind" NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "profile_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" "skill_category" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "location" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "summary" TEXT,
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "repository_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_experience_technologies" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_experience_technologies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_project_technologies" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_project_technologies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_slug_key" ON "profiles"("slug");

-- CreateIndex
CREATE INDEX "profile_links_profile_id_sort_order_idx" ON "profile_links"("profile_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "profile_links_profile_id_url_key" ON "profile_links"("profile_id", "url");

-- CreateIndex
CREATE INDEX "skills_profile_id_sort_order_idx" ON "skills"("profile_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "skills_profile_id_name_key" ON "skills"("profile_id", "name");

-- CreateIndex
CREATE INDEX "experiences_profile_id_end_date_start_date_idx" ON "experiences"("profile_id", "end_date" DESC, "start_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "experiences_profile_id_company_position_start_date_key" ON "experiences"("profile_id", "company", "position", "start_date");

-- CreateIndex
CREATE INDEX "projects_profile_id_sort_order_idx" ON "projects"("profile_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "projects_profile_id_name_key" ON "projects"("profile_id", "name");

-- CreateIndex
CREATE INDEX "_experience_technologies_B_index" ON "_experience_technologies"("B");

-- CreateIndex
CREATE INDEX "_project_technologies_B_index" ON "_project_technologies"("B");

-- AddForeignKey
ALTER TABLE "profile_links" ADD CONSTRAINT "profile_links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_experience_technologies" ADD CONSTRAINT "_experience_technologies_A_fkey" FOREIGN KEY ("A") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_experience_technologies" ADD CONSTRAINT "_experience_technologies_B_fkey" FOREIGN KEY ("B") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_project_technologies" ADD CONSTRAINT "_project_technologies_A_fkey" FOREIGN KEY ("A") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_project_technologies" ADD CONSTRAINT "_project_technologies_B_fkey" FOREIGN KEY ("B") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Integrity rules that the Prisma schema language cannot express.
-- Prisma Migrate does not manage CHECK constraints: it neither drops nor
-- recreates them, so keep them in mind if a table is ever rebuilt.
-- ---------------------------------------------------------------------------

-- An employment period cannot end before it starts.
ALTER TABLE "experiences"
  ADD CONSTRAINT "experiences_period_check"
  CHECK ("end_date" IS NULL OR "end_date" >= "start_date");

-- Slugs are part of the public API: lowercase kebab-case only.
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Display order is a non-negative position in the list.
ALTER TABLE "profile_links" ADD CONSTRAINT "profile_links_sort_order_check" CHECK ("sort_order" >= 0);
ALTER TABLE "skills"        ADD CONSTRAINT "skills_sort_order_check"        CHECK ("sort_order" >= 0);
ALTER TABLE "projects"      ADD CONSTRAINT "projects_sort_order_check"      CHECK ("sort_order" >= 0);

-- Prisma creates scalar lists as nullable columns; an empty list is the
-- only valid "no achievements" value.
ALTER TABLE "experiences" ALTER COLUMN "achievements" SET NOT NULL;
