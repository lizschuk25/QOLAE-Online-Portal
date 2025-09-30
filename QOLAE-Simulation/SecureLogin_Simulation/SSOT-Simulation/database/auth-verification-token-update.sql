CREATE TABLE "AuthVerificationToken" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  pin TEXT,
  method TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW(),
  expiresAt TIMESTAMP NOT NULL
);

CREATE INDEX "AuthVerificationToken_email_idx" ON "AuthVerificationToken"("email");
CREATE INDEX "AuthVerificationToken_token_idx" ON "AuthVerificationToken"("token");


