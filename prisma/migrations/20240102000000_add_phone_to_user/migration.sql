-- AlterTable: add phone column to User if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'phone'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "phone" TEXT;
  END IF;
END $$;
