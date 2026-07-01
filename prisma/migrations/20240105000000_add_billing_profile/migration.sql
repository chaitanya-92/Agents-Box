-- Add invoiceNumber to Payment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'invoiceNumber') THEN
    ALTER TABLE "Payment" ADD COLUMN "invoiceNumber" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'Payment' AND indexname = 'Payment_invoiceNumber_key') THEN
    CREATE UNIQUE INDEX "Payment_invoiceNumber_key" ON "Payment"("invoiceNumber");
  END IF;
END $$;

-- Create BillingProfile table
CREATE TABLE IF NOT EXISTS "BillingProfile" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "companyName"  TEXT,
  "gstin"        TEXT,
  "pan"          TEXT,
  "phone"        TEXT NOT NULL,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "city"         TEXT NOT NULL,
  "state"        TEXT NOT NULL,
  "pinCode"      TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingProfile_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'BillingProfile' AND indexname = 'BillingProfile_userId_key') THEN
    CREATE UNIQUE INDEX "BillingProfile_userId_key" ON "BillingProfile"("userId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'BillingProfile_userId_fkey' AND table_name = 'BillingProfile'
  ) THEN
    ALTER TABLE "BillingProfile" ADD CONSTRAINT "BillingProfile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Create invoice number sequence
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;
