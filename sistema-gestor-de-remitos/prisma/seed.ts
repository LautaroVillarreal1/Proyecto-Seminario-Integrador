import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all([
    prisma.rol.upsert({ where: { idRol: 1 }, update: { nombre: 'Administrador' }, create: { idRol: 1, nombre: 'Administrador' } }),
    prisma.rol.upsert({ where: { idRol: 2 }, update: { nombre: 'Encargado de Producción' }, create: { idRol: 2, nombre: 'Encargado de Producción' } }),
    prisma.rol.upsert({ where: { idRol: 3 }, update: { nombre: 'Responsable de Entrega' }, create: { idRol: 3, nombre: 'Responsable de Entrega' } }),
  ]);
  const estados = ['Aceptado', 'EnPreparación', 'Anulado', 'ListoParaEntrega', 'Firmado', 'Cobrado', 'Rechazado'];
  for (const nombre of estados) await prisma.estado.upsert({ where: { idEstado: estados.indexOf(nombre) + 1 }, update: { nombre }, create: { idEstado: estados.indexOf(nombre) + 1, nombre, descripcion: `Estado ${nombre}` } });
  const categorias = ['Yogur', 'Mermelada', 'Kefir', 'Dulce solido', 'Postre', 'Dulce de Leche'];
  for (const nombre of categorias) await prisma.categoria.upsert({ where: { idCategoria: categorias.indexOf(nombre) + 1 }, update: { nombre }, create: { idCategoria: categorias.indexOf(nombre) + 1, nombre } });
  const unidades = ['unidad', 'kilogramo', 'litro', 'gramo'];
  for (const nombre of unidades) await prisma.unidadDeMedida.upsert({ where: { idUnidadDeMedida: unidades.indexOf(nombre) + 1 }, update: { nombre }, create: { idUnidadDeMedida: unidades.indexOf(nombre) + 1, nombre } });
  const provincia = await prisma.provincia.upsert({ where: { idProvincia: 1 }, update: { nombre: 'Buenos Aires' }, create: { idProvincia: 1, nombre: 'Buenos Aires', descripcion: 'Provincia de Buenos Aires' } });
  await prisma.ciudad.upsert({ where: { idCiudad: 1 }, update: { nombre: 'La Plata', idProvincia: provincia.idProvincia }, create: { idCiudad: 1, nombre: 'La Plata', descripcion: 'Ciudad capital', codigoPostal: '1900', idProvincia: provincia.idProvincia } });
  await prisma.usuario.upsert({ where: { correoElectronico: 'admin@frulatti.com' }, update: { activo: true, idRol: roles[0].idRol }, create: { nombre: 'Administrador', apellido: 'Frulatti', correoElectronico: 'admin@frulatti.com', passwordHash: await bcrypt.hash('Frulatti123!', 12), idRol: roles[0].idRol } });
  console.log('Seed completado. Usuario: admin@frulatti.com / Frulatti123!');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());