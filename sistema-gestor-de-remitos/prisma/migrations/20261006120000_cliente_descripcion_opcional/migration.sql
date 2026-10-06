DO $$
BEGIN
	IF to_regclass('public."Cliente"') IS NOT NULL THEN
		ALTER TABLE "Cliente" ALTER COLUMN "descripcion" DROP NOT NULL;
		ALTER TABLE "Cliente" ALTER COLUMN "descripcion" TYPE VARCHAR(400);
	END IF;
END
$$;