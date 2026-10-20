import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateCategoriaDto, CreateInsumoDto, CreateProductoDto, UpdateCategoriaDto } from './dto';
import { CreateRecipeDto } from '../recipes/dto';

describe('CreateProductoDto', () => {
  it('requiere codigo y rechaza valores negativos para precios y stock', async () => {
    const dto = new CreateProductoDto();
    dto.nombre = 'Yogur';
    dto.descripcion = 'Desc';
    dto.precioUnitario = -1;
    dto.peso = 0.5;
    dto.idUnidadDeMedida = 1;
    dto.idCategoria = 1;
    dto.stockActual = -2;
    dto.stockMinimo = -3;

    const errors = await validate(dto);
    expect(errors.some(error => error.property === 'codigo')).toBe(true);
    expect(errors.some(error => error.property === 'precioUnitario')).toBe(true);
    expect(errors.some(error => error.property === 'stockActual')).toBe(true);
    expect(errors.some(error => error.property === 'stockMinimo')).toBe(true);
  });

  it('acepta codigo opcional de barras vacio y no falla con codigo obligatorio valido', async () => {
    const dto = new CreateProductoDto();
    dto.nombre = 'Yogur';
    dto.descripcion = 'Desc';
    dto.codigo = 'YOG-001';
    dto.codigoBarras = undefined;
    dto.precioUnitario = 100;
    dto.peso = 0.5;
    dto.idUnidadDeMedida = 1;
    dto.idCategoria = 1;
    dto.stockActual = 12;
    dto.stockMinimo = 2;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('acepta precio de venta igual a cero', async () => {
    const dto = new CreateProductoDto();
    dto.codigo = 'YOG-001';
    dto.nombre = 'Yogur';
    dto.descripcion = 'Desc';
    dto.precioUnitario = 0;
    dto.peso = 0.5;
    dto.idUnidadDeMedida = 1;
    dto.idCategoria = 1;

    const errors = await validate(dto);
    expect(errors.some(error => error.property === 'precioUnitario')).toBe(false);
  });

  it('requiere costo unitario positivo', async () => {
    const missingPriceErrors = await validate(new CreateInsumoDto());
    expect(missingPriceErrors.some(error => error.property === 'costoUnitario')).toBe(true);

    const dto = new CreateInsumoDto();
    dto.nombre = 'Leche';
    dto.descripcion = '';
    dto.idUnidadDeMedida = 1;
    dto.costoUnitario = 0;
    const zeroPriceErrors = await validate(dto);
    expect(zeroPriceErrors.some(error => error.property === 'costoUnitario')).toBe(true);

    dto.costoUnitario = -1;
    const negativePriceErrors = await validate(dto);
    expect(negativePriceErrors.some(error => error.property === 'costoUnitario')).toBe(true);

    dto.costoUnitario = 10;
    const positivePriceErrors = await validate(dto);
    expect(positivePriceErrors).toHaveLength(0);
  });

  it('rechaza nombre obligatorio vacio', async () => {
    const dto = new CreateProductoDto();
    dto.codigo = 'YOG-001';
    dto.nombre = ' ';
    dto.descripcion = '';
    dto.precioUnitario = 100;
    dto.peso = 0.5;
    dto.idUnidadDeMedida = 1;
    dto.idCategoria = 1;

    const errors = await validate(dto);
    expect(errors.some(error => error.property === 'nombre')).toBe(true);
  });
});

describe('Categoria DTOs', () => {
  it('rechaza nombres vacíos y acepta nombres con espacios para normalizar', async () => {
    const empty = new CreateCategoriaDto();
    empty.nombre = '   ';
    expect(await validate(empty)).not.toHaveLength(0);

    const valid = new CreateCategoriaDto();
    valid.nombre = '  QUESOS ';
    expect(await validate(valid)).toHaveLength(0);
  });

  it('rechaza null como nombre opcional de actualización', async () => {
    const dto = new UpdateCategoriaDto();
    dto.nombre = null as unknown as string;
    expect(await validate(dto)).not.toHaveLength(0);
  });
});

describe('CreateRecipeDto', () => {
  it('requiere al menos un ingrediente', async () => {
    const dto = new CreateRecipeDto();
    dto.descripcion = 'Yogur';
    dto.rendimiento = 1;
    dto.unidadRendimiento = 'unidad';
    dto.tiempoPrepMin = 10;
    dto.detalles = [];

    const errors = await validate(dto);
    expect(errors.some(error => error.property === 'detalles')).toBe(true);
  });
});
