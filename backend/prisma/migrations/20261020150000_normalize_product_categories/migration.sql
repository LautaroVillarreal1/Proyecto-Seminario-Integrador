DO $$
DECLARE
  category_group RECORD;
  keeper_id INTEGER;
BEGIN
  FOR category_group IN
    SELECT canonical_name, array_agg(id_categoria ORDER BY id_categoria) AS ids
    FROM (
      SELECT
        "idCategoria" AS id_categoria,
        CASE regexp_replace(lower(btrim("nombre")), '\s+', ' ', 'g')
          WHEN 'yogur' THEN 'yogures'
          WHEN 'yogures' THEN 'yogures'
          WHEN 'mermelada' THEN 'mermeladas'
          WHEN 'mermeladas' THEN 'mermeladas'
          WHEN 'kefir' THEN 'kéfires'
          WHEN 'kéfir' THEN 'kéfires'
          WHEN 'kéfires' THEN 'kéfires'
          WHEN 'kefires' THEN 'kéfires'
          WHEN 'granola' THEN 'granolas'
          WHEN 'granolas' THEN 'granolas'
          WHEN 'postre' THEN 'postres'
          WHEN 'postres' THEN 'postres'
          WHEN 'dulce solido' THEN 'dulces sólidos'
          WHEN 'dulce sólido' THEN 'dulces sólidos'
          WHEN 'dulces solidos' THEN 'dulces sólidos'
          WHEN 'dulces sólidos' THEN 'dulces sólidos'
          WHEN 'dulce de leche' THEN 'dulces de leche'
          WHEN 'dulces de leche' THEN 'dulces de leche'
          ELSE regexp_replace(lower(btrim("nombre")), '\s+', ' ', 'g')
        END AS canonical_name
      FROM "Categoria"
    ) AS normalized
    GROUP BY canonical_name
  LOOP
    keeper_id := category_group.ids[1];
    UPDATE "Producto"
    SET "idCategoria" = keeper_id
    WHERE "idCategoria" = ANY(category_group.ids);

    UPDATE "Categoria"
    SET "nombre" = category_group.canonical_name
    WHERE "idCategoria" = keeper_id;

    DELETE FROM "Categoria"
    WHERE "idCategoria" = ANY(category_group.ids)
      AND "idCategoria" <> keeper_id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

DO $$
DECLARE
  category_sequence REGCLASS;
  sequence_value BIGINT;
  max_category_id INTEGER;
BEGIN
  category_sequence := pg_get_serial_sequence('"Categoria"', 'idCategoria')::REGCLASS;
  EXECUTE format('SELECT last_value FROM %s', category_sequence) INTO sequence_value;
  SELECT COALESCE(MAX("idCategoria"), 0) INTO max_category_id FROM "Categoria";
  PERFORM setval(category_sequence, GREATEST(sequence_value, max_category_id), true);
END $$;

INSERT INTO "Categoria" ("nombre")
VALUES ('granolas')
ON CONFLICT ("nombre") DO NOTHING;

UPDATE "Producto"
SET "idCategoria" = (SELECT "idCategoria" FROM "Categoria" WHERE "nombre" = 'granolas')
WHERE "codigo" LIKE 'GRA-%'
   OR lower("nombre") LIKE 'granola%';
