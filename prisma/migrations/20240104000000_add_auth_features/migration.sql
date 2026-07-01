-- Add emailVerified and verification token fields to User
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'emailVerified') THEN
    ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'verificationToken') THEN
    ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'verificationExpiry') THEN
    ALTER TABLE "User" ADD COLUMN "verificationExpiry" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'resetToken') THEN
    ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'resetTokenExpiry') THEN
    ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'trialEndsAt') THEN
    ALTER TABLE "User" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'gstin') THEN
    ALTER TABLE "User" ADD COLUMN "gstin" TEXT;
  END IF;
END $$;

-- Add unique indexes (ignore if already exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'User' AND indexname = 'User_verificationToken_key'
  ) THEN
    CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'User' AND indexname = 'User_resetToken_key'
  ) THEN
    CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");
  END IF;
END $$;

-- Create ApiKey table
CREATE TABLE IF NOT EXISTS "ApiKey" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "keyHash"   TEXT NOT NULL,
  "prefix"    TEXT NOT NULL,
  "lastUsed"  TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'ApiKey' AND indexname = 'ApiKey_keyHash_key') THEN
    CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ApiKey_userId_fkey' AND table_name = 'ApiKey'
  ) THEN
    ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Create Conversation table
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "agentId"   TEXT NOT NULL,
  "title"     TEXT NOT NULL DEFAULT 'New conversation',
  "messages"  JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'Conversation' AND indexname = 'Conversation_userId_agentId_idx') THEN
    CREATE INDEX "Conversation_userId_agentId_idx" ON "Conversation"("userId", "agentId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Conversation_userId_fkey' AND table_name = 'Conversation'
  ) THEN
    ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
