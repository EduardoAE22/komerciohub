# KomercioHub

Plataforma SaaS para ayudar a pequeños negocios y pymes a vender en línea y organizar su operación diaria (tipo mini ERP).

## Objetivo del proyecto

Construir un sistema realista que me permita practicar y demostrar experiencia en:

- **Backend:** Node.js (APIs REST, integración con otros servicios).
- **Frontend:** React para panel de administración y tienda web.
- **Otros lenguajes/frameworks:** Laravel (PHP) y Python (servicios complementarios).
- **Bases de datos:** PostgreSQL, MySQL y MongoDB.
- **APIs REST y GraphQL.**
- **Cloud:** despliegue en AWS / Azure / GCP (por definir).
- **DevOps:** Git, CI/CD, contenedores Docker.
- **Seguridad:** buenas prácticas basadas en OWASP.

## Estructura del repositorio

- `frontend-react/` → Aplicación web en React (tienda y panel de administración).
- `backend-node/` → API principal en Node.js (Express / Nest, por definir).
- `micro-laravel-billing/` → Servicio en Laravel para facturación / comprobantes.
- `micro-python-analytics/` → Servicio en Python para analytics y recomendaciones.
- `docs/` → Documentación de arquitectura, APIs y decisiones técnicas.
- `infra/` → Docker, docker-compose y, más adelante, archivos de infraestructura (k8s, cloud).
- `.github/workflows/` → Pipelines de CI/CD (GitHub Actions).

## Roadmap (alto nivel)

1. **Fase 1 – Core inicial**
   - Crear backend básico en Node.js con PostgreSQL.
   - CRUD de usuarios, productos y pedidos (API REST).
   - Frontend React con login y listado de productos.

2. **Fase 2 – Microservicios**
   - Agregar servicio en Laravel para facturación.
   - Agregar servicio en Python para analytics.
   - Integrar servicios entre sí vía APIs.

3. **Fase 3 – Infraestructura**
   - Contenedores Docker para cada servicio.
   - docker-compose para desarrollo local.
   - CI/CD con GitHub Actions.

4. **Fase 4 – Seguridad y optimización**
   - Ajustes basados en OWASP.
   - SEO técnico y performance en frontend.
