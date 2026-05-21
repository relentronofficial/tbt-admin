-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SuperAdmin', 'Manager', 'Moderator', 'Viewer');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('Active', 'Inactive', 'Suspended');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('Active', 'Inactive', 'Expired');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('Draft', 'Published', 'Archived');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('Todo', 'InProgress', 'Review', 'Done');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('Post', 'Announcement', 'Poll');

-- CreateEnum
CREATE TYPE "WebinarStatus" AS ENUM ('Scheduled', 'Live', 'Ended');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('System', 'Course', 'Task', 'Community', 'Webinar');

-- CreateTable
CREATE TABLE "wrappers_fdw_stats" (
    "fdw_name" TEXT NOT NULL,
    "create_times" BIGINT,
    "rows_in" BIGINT,
    "rows_out" BIGINT,
    "bytes_in" BIGINT,
    "bytes_out" BIGINT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "wrappers_fdw_stats_pkey" PRIMARY KEY ("fdw_name")
);
