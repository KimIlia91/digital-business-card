import type { ProfileSeedInput } from '../profile-seed.schema.js';

/**
 * Content of the business card: the single source of truth for the database.
 * It is the owner's card, so the slug may be changed freely.
 *
 * Rules (checked by profile-seed.schema.ts before anything is written):
 * - dates are `YYYY-MM-DD`; omit `endDate` for the current position;
 * - names, link URLs and company + position + start date are unique;
 * - `technologies` reference skills by name, so list them in `skills` first;
 * - list order is display order.
 */
export const profileData = {
  slug: 'ilia-kim',
  name: 'Илья Ким',
  headline: 'Full-stack разработчик (TypeScript, C#/.NET, Java)',
  description:
    'Full-stack разработчик из Бишкека: бэкенд на C#/.NET, Java и TypeScript, фронтенд на Svelte, React и Next.js. Сейчас развиваю бэкенд криптовалютной платформы — платёжные сценарии, интеграции с банковскими и крипто-провайдерами, KYC/AML, аутентификация и безопасность. Люблю понятную архитектуру и код, который не страшно менять.',
  location: 'Бишкек, Кыргызстан · удалённо',
  avatarUrl:
    'https://avatars.githubusercontent.com/u/120381464?s=400&u=070c93cb1381a4fdc328f8888775c9af0c220527&v=4',

  links: [
    { kind: 'GITHUB', label: 'GitHub', url: 'https://github.com/KimIlia91' },
    {
      kind: 'EMAIL',
      label: 'Email',
      url: 'mailto:paterfamelias@gmail.com',
    },
    { kind: 'TELEGRAM', label: 'Telegram', url: 'https://t.me/Kor2710' },
    { kind: 'OTHER', label: 'Телефон', url: 'tel:+996709249884' },
  ],

  skills: [
    { name: 'TypeScript', category: 'LANGUAGE' },
    { name: 'JavaScript', category: 'LANGUAGE' },
    { name: 'C#', category: 'LANGUAGE' },
    { name: 'Java', category: 'LANGUAGE' },
    { name: 'SQL', category: 'LANGUAGE' },

    { name: '.NET', category: 'BACKEND' },
    { name: 'ASP.NET Core', category: 'BACKEND' },
    { name: 'Node.js', category: 'BACKEND' },
    { name: 'NestJS', category: 'BACKEND' },
    { name: 'Spring Boot', category: 'BACKEND' },
    { name: 'SignalR', category: 'BACKEND' },

    { name: 'React', category: 'FRONTEND' },
    { name: 'Next.js', category: 'FRONTEND' },
    { name: 'Svelte', category: 'FRONTEND' },
    { name: 'Tailwind CSS', category: 'FRONTEND' },

    { name: 'PostgreSQL', category: 'DATABASE' },
    { name: 'MS SQL Server', category: 'DATABASE' },
    { name: 'Redis', category: 'DATABASE' },
    { name: 'Entity Framework Core', category: 'DATABASE' },
    { name: 'Spring Data JPA', category: 'DATABASE' },
    { name: 'Prisma', category: 'DATABASE' },

    { name: 'REST API', category: 'API' },
    { name: 'GraphQL', category: 'API' },
    { name: 'gRPC', category: 'API' },
    { name: 'JWT', category: 'API' },
    { name: 'OAuth2', category: 'API' },

    { name: 'Docker', category: 'INFRASTRUCTURE' },
    { name: 'GitLab CI/CD', category: 'INFRASTRUCTURE' },
    { name: 'S3 / MinIO', category: 'INFRASTRUCTURE' },

    { name: 'Vitest', category: 'TESTING' },

    { name: 'Git', category: 'TOOLING' },
    { name: 'Azure DevOps', category: 'TOOLING' },

    { name: 'Clean Architecture', category: 'PRACTICE' },
    { name: 'CQRS', category: 'PRACTICE' },
    { name: 'SOLID', category: 'PRACTICE' },
    { name: 'RBAC / ABAC', category: 'PRACTICE' },
    { name: 'Scrum / Kanban', category: 'PRACTICE' },
  ],

  experience: [
    {
      company: 'ОсОО Траст Байт',
      position: 'C#/.NET-разработчик',
      location: 'Бишкек',
      startDate: '2026-03-01',
      summary:
        'Бэкенд криптовалютной платформы на .NET и ASP.NET Core: архитектура монолита, доменные сущности и бизнес-процессы.',
      achievements: [
        'Реализовал платёжные сценарии Buy/Sell: статусы операций, лимиты, комиссии и фоновые процессы.',
        'Интегрировал платёжных и банковских провайдеров — Namba, Hyperion, XPay.',
        'Разработал криптовалютные интеграции для сетей TRON и EVM: депозиты, транзакции и балансы.',
        'Подключил KYC/AML-процессы с провайдерами Sumsub и Ranex.',
        'Выстроил аутентификацию и защиту: JWT, refresh-токены, MFA/OTP, rate limiting, CSRF, отзыв сессий.',
        'Сделал массовые рассылки и обработку данных устойчивыми к повторной обработке и потере записей.',
        'Провёл технический аудит кода и спланировал рефакторинг без нарушения действующих интеграций.',
      ],
      technologies: [
        'C#',
        '.NET',
        'ASP.NET Core',
        'PostgreSQL',
        'Entity Framework Core',
        'Redis',
        'SignalR',
        'Docker',
        'GitLab CI/CD',
      ],
    },
    {
      company: 'Smart city',
      position: 'Junior Java Backend-разработчик',
      location: 'Бишкек',
      startDate: '2024-10-01',
      endDate: '2025-09-30',
      summary:
        'Бэкенд-системы на Java и Spring Boot в команде из пяти человек.',
      achievements: [
        'Проектировал REST API и участвовал в архитектуре микросервисов.',
        'Реализовал аутентификацию и авторизацию по моделям RBAC и ABAC.',
        'Настроил межсервисное взаимодействие по gRPC.',
        'Подключил файловое хранилище S3 / MinIO.',
      ],
      technologies: [
        'Java',
        'Spring Boot',
        'Spring Data JPA',
        'gRPC',
        'REST API',
        'JWT',
        'OAuth2',
        'PostgreSQL',
        'S3 / MinIO',
      ],
    },
    {
      company: 'ОсОО Цифровые инновации',
      position: 'Junior Frontend-разработчик',
      location: 'Бишкек',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      summary: 'Клиентская часть веб-приложения на Svelte и TypeScript.',
      achievements: [
        'Разработал пользовательские интерфейсы и бизнес-логику на стороне клиента.',
        'Интегрировал фронтенд с backend API и участвовал в проектировании их взаимодействия.',
        'Оптимизировал производительность и улучшил UX/UI.',
      ],
      technologies: ['Svelte', 'TypeScript', 'Tailwind CSS', 'REST API'],
    },
    {
      company: 'Megalab',
      position: 'Frontend-разработчик, стажёр',
      location: 'Бишкек',
      startDate: '2023-11-01',
      endDate: '2024-01-31',
      summary: 'Интерфейсы веб-приложений на React и Next.js.',
      achievements: [
        'Разрабатывал компоненты пользовательского интерфейса на React и Next.js.',
        'Интегрировал внешние API и библиотеки.',
        'Делал вёрстку адаптивной и стилизовал компоненты на Tailwind CSS.',
      ],
      technologies: [
        'React',
        'Next.js',
        'JavaScript',
        'Tailwind CSS',
        'REST API',
      ],
    },
    {
      company: 'TimlySoft',
      position: 'C#/.NET-разработчик, стажёр',
      location: 'Бишкек',
      startDate: '2023-05-01',
      endDate: '2023-10-31',
      summary:
        'Серверная часть CRM для квартальной отчётности резидентов Парка высоких технологий, команда из девяти человек.',
      achievements: [
        'Разработал веб-API на ASP.NET Core по принципам Clean Architecture.',
        'Применил CQRS через MediatR для разделения команд и запросов.',
        'Реализовал аутентификацию и ролевую авторизацию на ASP.NET Core Identity.',
        'Сделал генерацию отчётов в Excel через EPPlus и хранение файлов в базе данных.',
      ],
      technologies: [
        'C#',
        '.NET',
        'ASP.NET Core',
        'Entity Framework Core',
        'PostgreSQL',
        'Clean Architecture',
        'CQRS',
        'Azure DevOps',
      ],
    },
  ],

  projects: [
    {
      name: 'Цифровая визитка',
      description:
        'Этот проект: GraphQL API на NestJS, Prisma и PostgreSQL с Apollo Sandbox, Docker и автоматической инициализацией базы данных.',
      url: 'https://digital-business-card-0qn8.onrender.com',
      repositoryUrl: 'https://github.com/KimIlia91/digital-business-card',
      technologies: [
        'TypeScript',
        'Node.js',
        'NestJS',
        'GraphQL',
        'Prisma',
        'PostgreSQL',
        'Docker',
        'Vitest',
      ],
    },
    {
      name: 'Post Hub — микросервисы на Spring Boot',
      description:
        'Платформа публикаций из трёх сервисов: шлюз, сервис постов и комментариев и сервис общих утилит. Аутентификация по JWT, миграции базы, сборка в Docker и деплой через GitLab CI/CD.',
      repositoryUrl: 'https://gitlab.com/spring-boot-app-post-hub',
      technologies: [
        'Java',
        'Spring Boot',
        'PostgreSQL',
        'REST API',
        'JWT',
        'Docker',
        'GitLab CI/CD',
      ],
    },
    {
      name: 'Mini-CRM для строительной компании',
      description:
        'Управление объектами и задачами с ролями постановщика и исполнителя, переходами статусов и историей изменений. Правила доступа вынесены в базу данных, покрытие тестами на нескольких уровнях.',
      url: 'https://mini-crm-seven-kappa.vercel.app',
      repositoryUrl: 'https://github.com/KimIlia91/mini-crm',
      technologies: [
        'TypeScript',
        'React',
        'PostgreSQL',
        'SQL',
        'Tailwind CSS',
        'Vitest',
      ],
    },
    {
      name: 'ProjectHub — Web API для проектов и задач',
      description:
        'Backend для проектов, задач, комментариев и файлов: слоистая архитектура с разделением на команды и запросы, аутентификация по JWT, файлы в S3-совместимом хранилище, миграции и запуск в Docker.',
      repositoryUrl: 'https://github.com/KimIlia91/ProjectHub',
      technologies: [
        'C#',
        'ASP.NET Core',
        'Entity Framework Core',
        'PostgreSQL',
        'CQRS',
        'Clean Architecture',
        'JWT',
        'S3 / MinIO',
        'Docker',
      ],
    },
    {
      name: 'Веб-клиент мессенджера на GREEN-API',
      description:
        'Клиент личных переписок поверх HTTP-API: подключение инстанса, получение уведомлений, маршрутизация и хранилище состояния на клиенте.',
      url: 'https://green-api-wine.vercel.app',
      repositoryUrl: 'https://github.com/KimIlia91/green-api',
      technologies: ['TypeScript', 'React', 'REST API'],
    },
    {
      name: 'Портфолио с 3D-сценой',
      description:
        'Одностраничный сайт-портфолио: трёхмерная сцена, анимации переходов и форма обратной связи.',
      repositoryUrl: 'https://github.com/KimIlia91/3D-Portfolio',
      technologies: ['JavaScript', 'React', 'Tailwind CSS'],
    },
  ],
} satisfies ProfileSeedInput;
