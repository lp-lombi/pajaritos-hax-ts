# pajaritos-hax-ts
Version del host en typescript. Se apunta a mantener en módulos separados los componentes de este proyecto.

```plaintext
├── server
│   ├── room
│   └── ui (compilado en React)
├── shared
└── web-api
```

`server`, el servidor dedicado que contiene una instancia de `room` que puede ser controlada a través del frontend de `UI`

`room`, el módulo que crea una instancia de la sala de Haxball bajo la API `node-haxball` de ABC junto con los plugins propios.

`ui`, el proyecto en React para la interfaz de usuario del panel de control del servidor dedicado.

`shared`, contiene los tipos compartidos, principalmente DTOs y una definición de tipos de la API node-haxball

`web-api`, el servicio web para autenticación, almacenamiento de stats, usuarios, bans, etc.