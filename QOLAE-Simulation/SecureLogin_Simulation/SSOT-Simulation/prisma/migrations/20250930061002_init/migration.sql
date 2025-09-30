-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "filename" TEXT NOT NULL,
    "originalPath" TEXT NOT NULL,
    "tempPath" TEXT,
    "finalPath" TEXT,
    "documentType" TEXT NOT NULL,
    "isGenerated" BOOLEAN DEFAULT false,
    "isCustomized" BOOLEAN DEFAULT false,
    "isSent" BOOLEAN DEFAULT false,
    "isPushed" BOOLEAN DEFAULT false,
    "generatedAt" TIMESTAMP(6),
    "sentAt" TIMESTAMP(6),
    "pushedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "lawyerId" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lawyer" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "pin" TEXT NOT NULL,
    "lawFirm" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Pending',
    "readyToGenerateDocuments" BOOLEAN DEFAULT false,
    "readyToGenerateDocumentsSealed" BOOLEAN DEFAULT false,
    "sendEmail" BOOLEAN DEFAULT false,
    "sendEmailSealed" BOOLEAN DEFAULT false,
    "pushToCentralRepository" BOOLEAN DEFAULT false,
    "pushToCentralRepositorySealed" BOOLEAN DEFAULT false,
    "readyToSend" BOOLEAN,
    "pinAddedToTOB" BOOLEAN,
    "customizedTOBPath" TEXT,
    "pinHyperlink" TEXT,
    "documentsSent" BOOLEAN,
    "emailSentAt" TIMESTAMP(6),
    "pushedToRepository" BOOLEAN,
    "repositoryPath" TEXT,
    "completedAt" TIMESTAMP(6),
    "followUpDueDate" TIMESTAMP(6),
    "followUpStatus" TEXT,
    "stackGroup" TEXT DEFAULT 'Library',
    "position" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "isEditable" BOOLEAN DEFAULT true,
    "isDraggable" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT DEFAULT 'admin',
    "customEmailSubject" TEXT DEFAULT '',
    "customEmailContent" TEXT DEFAULT '',
    "cardCollapsed" BOOLEAN DEFAULT false,

    CONSTRAINT "Lawyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Note" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(6),
    "lawyerId" TEXT NOT NULL,
    "author" TEXT DEFAULT 'admin',

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuthVerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebAuthnUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebAuthnUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebAuthnCredential" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_documents_lawyer_id" ON "public"."Document"("lawyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Lawyer_pin_key" ON "public"."Lawyer"("pin");

-- CreateIndex
CREATE INDEX "idx_lawyer_pin" ON "public"."Lawyer"("pin");

-- CreateIndex
CREATE INDEX "idx_lawyer_status" ON "public"."Lawyer"("status");

-- CreateIndex
CREATE INDEX "idx_note_lawyer_id" ON "public"."Note"("lawyerId");

-- CreateIndex
CREATE INDEX "AuthVerificationToken_email_idx" ON "public"."AuthVerificationToken"("email");

-- CreateIndex
CREATE INDEX "AuthVerificationToken_token_idx" ON "public"."AuthVerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "WebAuthnUser_email_key" ON "public"."WebAuthnUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WebAuthnCredential_credentialId_key" ON "public"."WebAuthnCredential"("credentialId");

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."Lawyer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "public"."Lawyer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."WebAuthnCredential" ADD CONSTRAINT "WebAuthnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."WebAuthnUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
