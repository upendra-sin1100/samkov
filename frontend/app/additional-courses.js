// Each course includes the same six-project, review-based completion path.
export const additionalCourses = [
    {
        slug: 'frontend-development', name: 'Frontend Development', category: 'Development', icon: 'code', color: 'orange', weeks: 6, projects: 6,
        description: 'Build accessible, responsive web interfaces with JavaScript and React.', skills: ['HTML & CSS', 'JavaScript', 'React'],
        resources: [{ label: 'MDN · Web development curriculum', url: 'https://developer.mozilla.org/en-US/curriculum/' }, { label: 'React · Learn', url: 'https://react.dev/learn' }],
        tasks: [
            ['Responsive Landing Page', 'Create a semantic landing page with mobile and desktop layouts. Demonstrate keyboard navigation and readable contrast.'],
            ['Validated Multi-step Form', 'Build a JavaScript form with accessible errors, back navigation, and preserved input. Test valid and invalid entries.'],
            ['React Data Dashboard', 'Build a React dashboard with filtering and API data. Include loading, empty, and error states and component tests.'],
            ['Accessibility and Performance Audit', 'Audit your dashboard with keyboard checks and browser tools. Fix issues and document before-and-after measurements.'],
            ['Reusable Component Library', 'Create documented, reusable UI components with keyboard interactions and tests. Demonstrate them in a sample application.'],
            ['Frontend Capstone', 'Deliver a deployed frontend solving a clear user need. Include responsive screenshots, tested user journeys, and setup instructions.']
        ]
    },
    {
        slug: 'backend-development', name: 'Backend Development', category: 'Development', icon: 'terminal', color: 'green', weeks: 8, projects: 6,
        description: 'Design reliable APIs, model data, and build secure server applications.', skills: ['Node.js', 'SQL', 'API design'],
        resources: [{ label: 'Node.js · Documentation', url: 'https://nodejs.org/en/docs/' }, { label: 'PostgreSQL · Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html' }],
        tasks: [
            ['HTTP Service', 'Build a Node.js service with routing, validation, and consistent errors. Document requests and test success and failure cases.'],
            ['Relational Data Model', 'Design a relational schema with constraints and migrations. Demonstrate CRUD queries and transaction rollback with test data.'],
            ['Authenticated REST API', 'Add authentication and per-user authorization to a database-backed API. Test that users cannot access another user\'s records.'],
            ['Background Job Worker', 'Implement queued work with bounded retries and duplicate handling. Demonstrate recovery from a failed job.'],
            ['API Reliability Lab', 'Add structured logs, rate limits, and health checks. Run a repeatable load test and report bottlenecks and improvements.'],
            ['Backend Capstone', 'Ship a documented service with persistent data, automated tests, and an API specification. Include deployment and recovery instructions.']
        ]
    },
    {
        slug: 'java-development', name: 'Java Development', category: 'Development', icon: 'code', color: 'orange', weeks: 8, projects: 6,
        description: 'Develop maintainable Java applications using object-oriented design and tested services.', skills: ['Java', 'OOP', 'SQL'],
        resources: [{ label: 'Oracle · Java documentation', url: 'https://docs.oracle.com/en/java/' }, { label: 'Dev.java · Learn Java', url: 'https://dev.java/learn/' }],
        tasks: [
            ['Java Fundamentals Toolkit', 'Write tested Java utilities using collections, conditionals, and exception handling. Include boundary cases and usage examples.'],
            ['Object-oriented Library Manager', 'Model books, members, and loans in a CLI application. Validate inputs and explain your class responsibilities.'],
            ['Persistent Inventory Application', 'Store inventory in a relational database using parameterized queries. Test transactions, constraints, and missing records.'],
            ['Java REST Service', 'Expose validated CRUD endpoints with consistent errors. Add integration tests and document example requests.'],
            ['Concurrent Processing Lab', 'Process independent jobs concurrently with bounded resources. Test failure handling and compare results with sequential execution.'],
            ['Java Capstone', 'Deliver a tested Java application with persistence, a reproducible build, and a working demonstration. Explain architecture and limitations.']
        ]
    },
    {
        slug: 'mobile-development', name: 'Mobile App Development', category: 'Development', icon: 'code', color: 'purple', weeks: 8, projects: 6,
        description: 'Create practical mobile apps with adaptive layouts, navigation, and offline data.', skills: ['Flutter', 'Dart', 'Mobile UX'],
        resources: [{ label: 'Flutter · Documentation and learning', url: 'https://docs.flutter.dev/' }, { label: 'Android · Basics with Compose course', url: 'https://developer.android.com/courses/android-basics-compose/course' }],
        tasks: [
            ['Adaptive Profile App', 'Build a Flutter profile app with adaptive layouts and accessible labels. Show results on two screen sizes.'],
            ['Interactive Expense Calculator', 'Create a form-driven calculator with validation and state management. Test calculation boundaries and invalid input.'],
            ['Multi-screen Planner', 'Build a planner with navigation, editable items, and local persistence. Verify data survives an app restart.'],
            ['API-backed Mobile App', 'Fetch public API data with loading, empty, and failure states. Cache recent results and demonstrate offline behavior.'],
            ['Mobile Quality Lab', 'Add unit and widget tests, audit accessibility, and profile your app. Document the issues found and fixes verified.'],
            ['Mobile Capstone', 'Deliver a complete Flutter app with a runnable build, demonstration video, and setup instructions. Document privacy choices and device testing.']
        ]
    },
    {
        slug: 'devops-cloud', name: 'DevOps & Cloud', category: 'Development', icon: 'terminal', color: 'cyan', weeks: 8, projects: 6,
        description: 'Automate builds, package services, and practice reliable deployment in local labs.', skills: ['Docker', 'CI/CD', 'Kubernetes'],
        resources: [{ label: 'Docker · Documentation', url: 'https://docs.docker.com/' }, { label: 'Kubernetes · Learn the basics', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/' }],
        tasks: [
            ['Repeatable Environment Setup', 'Write a setup script for a sample service with dependency checks and useful logs. Verify repeat runs are safe.'],
            ['Containerized Application', 'Package a service in Docker with a health check and non-root runtime. Document configuration and local startup.'],
            ['Continuous Integration Pipeline', 'Create a pipeline that runs tests and builds an artifact. Demonstrate that failed tests prevent a successful build.'],
            ['Local Kubernetes Deployment', 'Deploy a sample application to a local cluster with services and health probes. Demonstrate an update and rollback.'],
            ['Monitoring and Recovery Lab', 'Collect logs and metrics, simulate a service failure, and restore service. Record detection and recovery steps.'],
            ['DevOps Capstone', 'Deliver a reproducible delivery pipeline with versioned configuration, checks, and a recovery runbook. Use a local environment so no paid cloud account is required.']
        ]
    },
    {
        slug: 'system-design', name: 'System Design', category: 'Development', icon: 'code', color: 'blue', weeks: 8, projects: 6,
        description: 'Reason about scale, data consistency, and reliability through working prototypes.', skills: ['Architecture', 'Caching', 'Distributed systems'],
        resources: [{ label: 'System Design Primer · Learning guide', url: 'https://github.com/donnemartin/system-design-primer' }, { label: 'PostgreSQL · Documentation', url: 'https://www.postgresql.org/docs/current/' }],
        tasks: [
            ['Requirements and Capacity Plan', 'Define a sample service\'s users, constraints, and traffic assumptions. Calculate storage and throughput estimates and explain uncertainty.'],
            ['URL Shortener Prototype', 'Build a persistent URL shortener with collision handling and validated input. Document API contracts and test redirect behavior.'],
            ['Caching Experiment', 'Add a cache to a small service. Measure latency and database traffic, and test expiry and stale-data behavior.'],
            ['Reliable Message Processing', 'Prototype a queue consumer with retries and duplicate handling. Demonstrate how it recovers after interruption.'],
            ['Resilience and Load Study', 'Run controlled load and failure experiments on your prototype. Identify bottlenecks and justify reliability improvements.'],
            ['System Design Capstone', 'Present a complete architecture and working critical-path prototype. Include capacity estimates, tradeoffs, failure scenarios, and measured results.']
        ]
    }
];
