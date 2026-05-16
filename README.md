# 💊 MedShelf - Gestor de Botiquín Digital

[![Angular](https://img.shields.io/badge/Angular-21.2.6-DD0031?style=flat-square&logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Compatible-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-11.6.2-CB3837?style=flat-square&logo=npm)](https://www.npmjs.com/)

## 📋 Descripción

**MedShelf** es una aplicación web moderna y responsiva diseñada para ayudarte a organizar y gestionar tu botiquín familiar de manera eficiente. Permite llevar un control detallado de medicamentos, su cantidad, dosis, fecha de vencimiento y estado de conservación.

Con una interfaz intuitiva y amigable, MedShelf te proporciona las herramientas necesarias para mantener tu botiquín siempre actualizado y accesible desde cualquier dispositivo.

## ✨ Características principales

- 🔐 **Autenticación segura**: Sistema de login y registro de usuarios
- 💾 **Gestión de medicamentos**: Agregar, editar y eliminar medicamentos del botiquín
- 📊 **Sistema de estados**: Visualiza rápidamente medicamentos vigentes, próximos a vencer y caducados
- 🔍 **Búsqueda avanzada**: Filtra medicamentos por nombre o características
- 📱 **Diseño responsivo**: Acceso desde escritorio, tablet o dispositivos móviles
- 👤 **Perfil de usuario**: Gestiona tu información personal
- 🎨 **Tema personalizable**: Interfaz adaptable a tus preferencias
- 🏥 **Gestión de tratamientos**: Registra y organiza tus tratamientos médicos

## 🛠️ Requisitos previos

Antes de instalar MedShelf, asegúrate de tener lo siguiente instalado:

- **Node.js** (versión 18 o superior)
- **npm** (versión 11.6.2 o superior)
- Un navegador web moderno (Chrome, Firefox, Safari, Edge)

Puedes verificar tu versión ejecutando:

```bash
node --version
npm --version
```

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/RubenPerez55/MedShelf-Frontend.git
cd MedShelf-Frontend
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará todos los paquetes necesarios especificados en `package.json`, incluyendo:

- Angular 21.2.6 y sus dependencias
- RxJS para manejo reactivo de datos
- Lucide Angular para iconografía
- Vitest para testing

### 3. Configurar el entorno (si es necesario)

Si el proyecto requiere conexión a una API backend, asegúrate de configurar las variables de entorno en los archivos de configuración correspondientes.

## 🚀 Uso

### Modo desarrollo (Angular CLI)

Para ejecutar la aplicación Angular en modo desarrollo con live reload automático:

```bash
ng serve -o
```

La aplicación estará disponible en `http://localhost:4200/` y se recargará automáticamente cuando hagas cambios en el código.

### Compilar para producción

Para compilar la aplicación optimizada para producción:

```bash
ng build
```

Los archivos compilados se encontrarán en el directorio `dist/`. Esta compilación está optimizada para rendimiento y está lista para desplegar.

### Ejecutar en modo observación

Para desarrollar con recompilación automática sin iniciar el servidor:

```bash
npm run watch
```

### Ejecutar pruebas

```bash
npm test
```

Ejecuta la suite de pruebas unitarias utilizando Vitest.

## 📁 Estructura del proyecto

```
MedShelf-Frontend/
├── MedShelf/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/              # Módulos principales de la app
│   │   │   │   └── layouts/       # Layouts compartidos
│   │   │   ├── features/          # Módulos de features
│   │   │   │   ├── auth/          # Autenticación (login, register)
│   │   │   │   ├── medkit/        # Gestión del botiquín
│   │   │   │   ├── meds/          # Gestión de tratamientos
│   │   │   │   ├── profile/       # Perfil del usuario
│   │   │   │   └── home/          # Página de inicio
│   │   │   └── shared/            # Componentes y servicios compartidos
│   │   │       ├── components/    # Componentes reutilizables
│   │   │       └── services/      # Servicios compartidos
│   │   ├── assets/                # Recursos estáticos
│   │   └── environments/          # Configuraciones por ambiente
│   ├── package.json
│   ├── tsconfig.json
│   └── angular.json
└── README.md
```

## 🔧 Tecnologías utilizadas

| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| Angular | 21.2.6 | Framework principal |
| TypeScript | 5.9 | Lenguaje de programación |
| RxJS | 7.8 | Programación reactiva |
| Lucide Angular | 1.0 | Iconografía vectorial |
| Angular Forms | 21.2.6 | Gestión de formularios |
| Vitest | 4.0.8 | Testing y unit tests |
| Prettier | Latest | Formateador de código |

## 📝 Scripts disponibles

| Script | Descripción | Equivalente Angular |
|--------|-------------|-------------------|
| `npm start` | Inicia el servidor de desarrollo | `ng serve -o` |
| `npm run build` | Compila para producción | `ng build` |
| `npm run watch` | Modo observación con recompilación automática | `ng build --watch` |
| `npm test` | Ejecuta las pruebas unitarias | `ng test` |

## 🤝 Buenas prácticas

- ✅ Sigue la estructura de carpetas establecida
- ✅ Utiliza componentes reutilizables cuando sea posible
- ✅ Implementa servicios compartidos en la carpeta `shared/services`
- ✅ Asegúrate de que los tests pasen antes de hacer commits
- ✅ Mantén el código limpio y formateado con Prettier

## 📧 Soporte y contribuciones

Si tienes preguntas, reportes de bugs o sugerencias, por favor abre un issue en el repositorio.

## 📄 Licencia

Este proyecto está bajo licencia privada. Todos los derechos reservados.
