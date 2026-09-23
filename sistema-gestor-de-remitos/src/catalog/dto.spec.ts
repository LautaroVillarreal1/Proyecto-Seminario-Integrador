import { validate } from 'class-validator';
import { CreateProductoDto } from './dto';

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
});
