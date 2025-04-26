-- Create combined indexes for frequent query patterns
-- Index for token validation (frequently queried together)
CREATE INDEX IF NOT EXISTS "Token_is_valid_is_used_idx" ON "Token"("is_valid", "is_used");

-- Index for submission date sorting/filtering
CREATE INDEX IF NOT EXISTS "Response_submitted_at_idx" ON "Response"("submitted_at" DESC);

-- Index for quick retrieval of submissions by date range
CREATE INDEX IF NOT EXISTS "Response_contest_type_submitted_at_idx" ON "Response"("contest_type", "submitted_at" DESC);

-- Improve token lookup with combined index
CREATE INDEX IF NOT EXISTS "Token_token_code_is_used_is_valid_idx" ON "Token"("token_code", "is_used", "is_valid");

-- Add comment to explain these optimizations
COMMENT ON TABLE "Token" IS 'Contains contest participation tokens with optimized indexes for high traffic loads';
COMMENT ON TABLE "Response" IS 'Stores user submissions with indexes optimized for frequent access patterns';