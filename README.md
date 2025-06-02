# pajaritos-hax-ts
Version del host en typescript. Se apunta a mantener en módulos separados los componentes de este proyecto:

`room`, el creador de las salas de Haxball
`ui`, el proyecto en React para la interfaz de usuario del panel
`server`, que incluiría una instancia de `room` y la `ui` compilada para controlarlo
`web-api`, el servicio web para almacenar los datos y autenticación
