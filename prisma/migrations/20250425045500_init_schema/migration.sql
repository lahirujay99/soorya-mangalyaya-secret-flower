-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "token_code" TEXT NOT NULL,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "contest_type" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "nic" TEXT,
    "contact_number" TEXT NOT NULL,
    "papaya_seed_guess" INTEGER,
    "flower_name_guess" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_id" TEXT NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_token_code_key" ON "Token"("token_code");

-- CreateIndex
CREATE INDEX "Token_token_code_idx" ON "Token"("token_code");

-- CreateIndex
CREATE INDEX "Token_is_used_idx" ON "Token"("is_used");

-- CreateIndex
CREATE UNIQUE INDEX "Response_token_id_key" ON "Response"("token_id");

-- CreateIndex
CREATE INDEX "Response_token_id_idx" ON "Response"("token_id");

-- CreateIndex
CREATE INDEX "Response_contest_type_idx" ON "Response"("contest_type");

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
