-- CreateTable
CREATE TABLE "FlowerResponse" (
    "id" TEXT NOT NULL,
    "contest_type" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "contact_number" TEXT NOT NULL,
    "secret_flower_name" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_id" TEXT NOT NULL,

    CONSTRAINT "FlowerResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlowerResponse_token_id_key" ON "FlowerResponse"("token_id");

-- CreateIndex
CREATE INDEX "FlowerResponse_contest_type_idx" ON "FlowerResponse"("contest_type");

-- CreateIndex
CREATE INDEX "FlowerResponse_token_id_idx" ON "FlowerResponse"("token_id");

-- AddForeignKey
ALTER TABLE "FlowerResponse" ADD CONSTRAINT "FlowerResponse_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
