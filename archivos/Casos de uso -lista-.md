

| Caso de Uso | Objetivo | Actores |
| :---- | :---- | :---- |
| 1\. Registrar pedido | Registrar un nuevo pedido de un cliente, cargando su fecha de entrega, el cliente que lo solicita, el detalle de productos con sus cantidades y subtotales, el total calculado y una observación opcional, quedando inicialmente en estado Aceptado. | AP: Responsable de Pedido AS: Responsable de Entrega |
| 2\. Cancelar pedido | Anular un pedido existente que aún no fue entregado, cambiando su estado a Cancelado y dejando constancia de la cancelación en el historial. | AP: Responsable de Pedido |
| 3\. Consultar pedidos | Visualizar el listado de pedidos con su número, cliente, fecha de entrega, estado, responsable de entrega y total, permitiendo ver el detalle de productos y las observaciones de cada uno. | AP: Responsable de Pedido AS: Administrador |
| 4\. Consultar clientes | Visualizar el listado de clientes registrados con su nombre, dirección, correo electrónico, teléfono y provincia, permitiendo acceder al detalle de cada uno. | AP: Responsable de Pedido AS: Administrador |
| 5\. Registrar nuevo cliente | Dar de alta un nuevo cliente ingresando su nombre, descripción, dirección, correo electrónico, número de teléfono y provincia (con su ciudad). | AP: Responsable de Pedido |
| 6\. Modificar cliente | Actualizar los datos de un cliente existente (nombre, descripción, dirección, correo electrónico, teléfono, provincia y ciudad), manteniendo su identificación original. | AP: Responsable de Pedido |
| 7\. Registrar nuevo producto | Dar de alta un nuevo producto ingresando su nombre, descripción, peso, precio unitario, categoría y unidad de medida, para que pueda ser incluido en los pedidos. | AP: Administrador |
| 8\. Modificar producto | Actualizar los datos de un producto existente (nombre, descripción, peso, precio, categoría y unidad de medida) y mantener vigente su información comercial. | AP: Administrador |
| 9\. Consultar productos | Visualizar el catálogo de productos con su nombre, categoría, peso, unidad de medida y precio unitario, permitiendo ver también la receta asociada a cada uno. | AP: Administrador AS: Responsable de Pedido |
| 10\. Consultar ubicación cliente en mapa | Mostrar en un mapa la ubicación del cliente de un pedido a partir de su dirección, ciudad y provincia, para que el viajante pueda llegar al lugar de entrega. | AP: Responsable de Entrega |
| 11\. Registrar situación de cobro pedido | Registrar el cobro de un pedido al momento de la entrega, indicando la forma de pago utilizada por el cliente y la fecha y hora en que se efectuó, y pasando el pedido a estado Cobrado. | AP: Responsable de Entrega AS: Responsable de Pedido |
| 12\. Registrar nuevo empleado | Dar de alta un nuevo empleado ingresando su nombre, apellido, DNI, número de teléfono y dirección, para que pueda ser vinculado a un usuario del sistema. | AP: Administrador |
| 13\. Consultar empleados | Visualizar el listado de empleados registrados con su nombre, apellido, DNI, teléfono y dirección, junto con el usuario y el rol asociados a cada uno. | AP: Administrador |
| 14\. Registrar observaciones pedido | Agregar o modificar una observación sobre un pedido, como inconvenientes o aclaraciones de la entrega, ya sea por el viajante al entregar o posteriormente por un usuario autorizado. | AP: Responsable de Entrega AS: Responsable de Pedido |
| 15\. Actualizar situación pedido | Cambiar el estado de un pedido según su avance (Aceptado, EnPreparación, ListoParaEntrega, Firmado, Cobrado, Rechazado), registrando la fecha de entrega cuando corresponda. | AP: Responsable de Entrega AS: Responsable de Pedido |
| 16\. Registrar receta producto | Definir la receta de un producto indicando su descripción y el detalle de insumos con la cantidad necesaria de cada uno, para calcular la capacidad de fabricación según el stock. | AP: Administrador |
| 17\. Registrar insumos | Dar de alta un nuevo insumo ingresando su nombre, descripción y unidad de medida, para poder utilizarlo en las recetas de los productos. | AP: Administrador |
| 18\. Consultar insumos | Visualizar el listado de insumos con su nombre, descripción y unidad de medida, y ver en qué recetas se utilizan. | AP: Administrador |
| 19\. Iniciar sesión | Autenticar a un usuario mediante su nombre de usuario y contraseña, y habilitarle únicamente las funcionalidades correspondientes a su rol. | AP: Usuario |
| 20\. Dar de baja cliente | Dar de baja un cliente que ya no opera con la empresa, impidiendo nuevos pedidos a su nombre y conservando el historial de los pedidos anteriores. | AP: Responsable de Pedido AS: Administrador |
| 21\. Dar de baja empleado | Dar de baja un empleado que ya no pertenece a la empresa, deshabilitando su usuario asociado y conservando su historial en los pedidos que tuvo asignados. | AP: Administrador |

