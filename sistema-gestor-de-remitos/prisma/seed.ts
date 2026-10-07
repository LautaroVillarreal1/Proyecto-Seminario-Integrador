import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const prisma = new PrismaClient();

function parseCsvLine(line: string): string[] {
  const columns: string[] = [];
  let column = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        column += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      columns.push(column);
      column = '';
    } else {
      column += character;
    }
  }

  columns.push(column);
  return columns;
}

async function main() {
  const csvPath = resolve(__dirname, '../../provincias_localidades_argentina (1).csv');
  const [header, ...lines] = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const columns = parseCsvLine(header);
  const rows = lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  });
  const provinces = new Map<number, { nombre: string; capitalId?: number }>();

  for (const [index, row] of rows.entries()) {
    const idProvincia = Number(row.id_provincia);
    const idCiudad = index + 1;
    const province = provinces.get(idProvincia) ?? { nombre: row.provincia };
    if (row.es_capital?.toLocaleLowerCase() === 'sí') province.capitalId = idCiudad;
    provinces.set(idProvincia, province);
  }

  for (const [idProvincia, province] of provinces) {
    await prisma.provincia.upsert({
      where: { idProvincia },
      update: { nombre: province.nombre, descripcion: '' },
      create: { idProvincia, nombre: province.nombre, descripcion: '' },
    });
  }

  for (const [index, row] of rows.entries()) {
    const idCiudad = index + 1;
    const codigoPostal = row.es_capital?.toLocaleLowerCase() === 'sí' ? row.codigo_postal_capital : '';
    await prisma.ciudad.upsert({
      where: { idCiudad },
      update: { nombre: row.localidad, descripcion: '', codigoPostal, idProvincia: Number(row.id_provincia) },
      create: { idCiudad, nombre: row.localidad, descripcion: '', codigoPostal, idProvincia: Number(row.id_provincia) },
    });
  }

  for (const [idProvincia, province] of provinces) {
    if (province.capitalId) await prisma.provincia.update({ where: { idProvincia }, data: { idCiudad: province.capitalId } });
  }

  const roles = await Promise.all([
    prisma.rol.upsert({ where: { idRol: 1 }, update: { nombre: 'Administrador' }, create: { idRol: 1, nombre: 'Administrador' } }),
    prisma.rol.upsert({ where: { idRol: 2 }, update: { nombre: 'Encargado de Producción' }, create: { idRol: 2, nombre: 'Encargado de Producción' } }),
    prisma.rol.upsert({ where: { idRol: 3 }, update: { nombre: 'Responsable de Entrega' }, create: { idRol: 3, nombre: 'Responsable de Entrega' } }),
  ]);
  const estados = ['Aceptado', 'EnPreparación', 'Anulado', 'ListoParaEntrega', 'Firmado', 'Cobrado', 'Rechazado', 'EnCamino'];
  for (const nombre of estados) await prisma.estado.upsert({ where: { idEstado: estados.indexOf(nombre) + 1 }, update: { nombre }, create: { idEstado: estados.indexOf(nombre) + 1, nombre, descripcion: `Estado ${nombre}` } });
  const categorias = ['Yogur', 'Mermelada', 'Kefir', 'Dulce solido', 'Postre', 'Dulce de Leche'];
  for (const nombre of categorias) await prisma.categoria.upsert({ where: { idCategoria: categorias.indexOf(nombre) + 1 }, update: { nombre }, create: { idCategoria: categorias.indexOf(nombre) + 1, nombre } });
  const unidades = ['unidad', 'kilogramo', 'litro', 'gramo'];
  for (const nombre of unidades) await prisma.unidadDeMedida.upsert({ where: { idUnidadDeMedida: unidades.indexOf(nombre) + 1 }, update: { nombre }, create: { idUnidadDeMedida: unidades.indexOf(nombre) + 1, nombre } });
  const admin = await prisma.usuario.upsert({ where: { correoElectronico: 'admin@frulatti.com' }, update: { activo: true, idRol: roles[0].idRol }, create: { nombre: 'Administrador', apellido: 'Frulatti', correoElectronico: 'admin@frulatti.com', passwordHash: await bcrypt.hash('Frulatti123!', 12), idRol: roles[0].idRol } });
  const sergioPassword = await bcrypt.hash('Sergio123!', 12);
  const marcosPassword = await bcrypt.hash('Marcos123!', 12);
  const sergio = await prisma.usuario.upsert({ where: { correoElectronico: 'sergio@lacteos.com' }, update: { activo: true, idRol: roles[2].idRol, passwordHash: sergioPassword }, create: { nombre: 'Sergio', apellido: 'Bello', correoElectronico: 'sergio@lacteos.com', passwordHash: sergioPassword, idRol: roles[2].idRol } });
  const marcos = await prisma.usuario.upsert({ where: { correoElectronico: 'marcos@lacteos.com' }, update: { activo: true, idRol: roles[2].idRol, passwordHash: marcosPassword }, create: { nombre: 'Marcos', apellido: 'Díaz', correoElectronico: 'marcos@lacteos.com', passwordHash: marcosPassword, idRol: roles[2].idRol } });
  const categoria = await prisma.categoria.upsert({ where: { idCategoria: 1 }, update: {}, create: { idCategoria: 1, nombre: 'Yogur' } });
  const unidad = await prisma.unidadDeMedida.upsert({ where: { idUnidadDeMedida: 1 }, update: {}, create: { idUnidadDeMedida: 1, nombre: 'unidad' } });
  const productos = await Promise.all([
    prisma.producto.upsert({ where: { idProducto: 1 }, update: {}, create: { idProducto: 1, codigo: 'YOG-001', codigoBarras: '7790000000001', nombre: 'Yogur Natural 500g', descripcion: 'Yogur natural cremoso', peso: 0.5, precioUnitario: 850, stockActual: 120, stockMinimo: 30, idCategoria: categoria.idCategoria, idUnidadDeMedida: unidad.idUnidadDeMedida } }),
    prisma.producto.upsert({ where: { idProducto: 2 }, update: {}, create: { idProducto: 2, codigo: 'GRA-001', codigoBarras: '7790000000002', nombre: 'Granola Clásica 300g', descripcion: 'Granola con avena y miel', peso: 0.3, precioUnitario: 1400, stockActual: 70, stockMinimo: 15, idCategoria: categoria.idCategoria, idUnidadDeMedida: unidad.idUnidadDeMedida } }),
  ]);
  const insumos = await Promise.all([
    prisma.insumo.upsert({ where: { idInsumo: 1 }, update: {}, create: { idInsumo: 1, nombre: 'Leche entera', descripcion: 'Leche para producción', stockActual: 500, stockMinimo: 100, costoUnitario: 120, proveedor: 'Tambo Los Álamos', idUnidadDeMedida: 3 } }),
    prisma.insumo.upsert({ where: { idInsumo: 2 }, update: {}, create: { idInsumo: 2, nombre: 'Fermento láctico', descripcion: 'Fermento para yogur', stockActual: 800, stockMinimo: 200, costoUnitario: 45, proveedor: 'BioFerm SA', idUnidadDeMedida: 4 } }),
    prisma.insumo.upsert({ where: { idInsumo: 3 }, update: {}, create: { idInsumo: 3, nombre: 'Avena', descripcion: 'Avena para granola', stockActual: 30, stockMinimo: 10, costoUnitario: 380, proveedor: 'Cereales del Sur', idUnidadDeMedida: 2 } }),
  ]);
  const recetaYogur = await prisma.receta.upsert({ where: { idReceta: 1 }, update: { descripcion: 'Yogur natural', rendimiento: 10, unidadRendimiento: 'unidades', tiempoPrepMin: 480, instrucciones: 'Calentar leche, agregar fermento y mantener 6-8 horas.', detalles: { deleteMany: {}, create: [{ idInsumo: insumos[0].idInsumo, cantidad: 5 }, { idInsumo: insumos[1].idInsumo, cantidad: 10 }] } }, create: { idReceta: 1, descripcion: 'Yogur natural', rendimiento: 10, unidadRendimiento: 'unidades', tiempoPrepMin: 480, instrucciones: 'Calentar leche, agregar fermento y mantener 6-8 horas.', detalles: { create: [{ idInsumo: insumos[0].idInsumo, cantidad: 5 }, { idInsumo: insumos[1].idInsumo, cantidad: 10 }] } } });
  const recetaGranola = await prisma.receta.upsert({ where: { idReceta: 2 }, update: { descripcion: 'Granola clásica', rendimiento: 15, unidadRendimiento: 'unidades', tiempoPrepMin: 60, instrucciones: 'Mezclar avena y hornear.', detalles: { deleteMany: {}, create: [{ idInsumo: insumos[2].idInsumo, cantidad: 3 }] } }, create: { idReceta: 2, descripcion: 'Granola clásica', rendimiento: 15, unidadRendimiento: 'unidades', tiempoPrepMin: 60, instrucciones: 'Mezclar avena y hornear.', detalles: { create: [{ idInsumo: insumos[2].idInsumo, cantidad: 3 }] } } });
  await prisma.producto.update({ where: { idProducto: productos[0].idProducto }, data: { idreceta: recetaYogur.idReceta } });
  await prisma.producto.update({ where: { idProducto: productos[1].idProducto }, data: { idreceta: recetaGranola.idReceta } });
  const sequences = [
    ['Rol', 'idRol'], ['Estado', 'idEstado'], ['Categoria', 'idCategoria'],
    ['UnidadDeMedida', 'idUnidadDeMedida'], ['Provincia', 'idProvincia'],
    ['Ciudad', 'idCiudad'], ['Usuario', 'idUsuario'], ['Producto', 'idProducto'],
    ['Insumo', 'idInsumo'], ['Receta', 'idReceta'], ['DetalleReceta', 'idDetalleReceta'],
    ['Cliente', 'idCliente'], ['Remito', 'idRemito'], ['DetalleRemito', 'idDetalleRemito'],
  ];
  for (const [table, column] of sequences) {
    await prisma.$queryRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', '${column}'), COALESCE(MAX("${column}"), 1), MAX("${column}") IS NOT NULL) FROM "${table}"`,
    );
  }
  console.log('Seed completado. Usuario: admin@frulatti.com / Frulatti123!');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());