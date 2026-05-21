-- CreateTable
CREATE TABLE "managers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" TEXT NOT NULL,
    "profile_photo_url" TEXT,
    "first_name" TEXT NOT NULL,
    "second_name" TEXT,
    "dob" DATE,
    "gender" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "business_name" TEXT,
    "business_established_on" DATE,
    "product_service_type" TEXT,
    "instagram_link" TEXT,
    "annual_turnover" TEXT,
    "goal_after_90_days" TEXT,
    "preferred_session_mode" TEXT,
    "gst_number" TEXT,
    "marketing_channels" TEXT[],
    "marketing_channel_name" TEXT,
    "domain_hosting_details" TEXT,
    "business_address" TEXT,
    "challenge_1" TEXT,
    "challenge_2" TEXT,
    "challenge_3" TEXT,
    "has_social_media_manager" BOOLEAN NOT NULL DEFAULT false,
    "social_media_manager_note" TEXT,
    "has_video_editing" BOOLEAN NOT NULL DEFAULT false,
    "video_editing_note" TEXT,
    "notes" TEXT,
    "membership_plan" TEXT NOT NULL DEFAULT 'Standard (Annual)',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "verification_status" TEXT NOT NULL DEFAULT 'AWAITING KYC',
    "account_manager_id" UUID,
    "task" TEXT,
    "assigned_by_id" UUID,
    "assigned_at" TIMESTAMPTZ,
    "kyc_document_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_member_id_key" ON "members"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_account_manager_id_fkey" FOREIGN KEY ("account_manager_id") REFERENCES "managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
