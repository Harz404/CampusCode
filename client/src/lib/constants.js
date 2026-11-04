// ============================================================
// CampusCode — Constants & Configuration
// ============================================================
export const SITE_NAME = 'CampusCode';
export const SITE_TAGLINE = 'Build. Manage. Sell. Earn.';
export const SITE_DESCRIPTION = 'CampusCode connects student developers with real-world opportunities to build, launch, and monetize software.';
export const CATEGORIES = [
    { id: 'web', name: 'Web Development', slug: 'web-development', icon: 'Globe' },
    { id: 'ai-ml', name: 'AI / ML', slug: 'ai-ml', icon: 'Brain' },
    { id: 'mobile', name: 'Mobile', slug: 'mobile', icon: 'Smartphone' },
    { id: 'saas', name: 'SaaS', slug: 'saas', icon: 'Cloud' },
    { id: 'api', name: 'APIs', slug: 'apis', icon: 'Plug' },
    { id: 'templates', name: 'Templates', slug: 'templates', icon: 'Layout' },
    { id: 'ui-kits', name: 'UI Kits', slug: 'ui-kits', icon: 'Palette' },
    { id: 'python', name: 'Python', slug: 'python', icon: 'Terminal' },
    { id: 'java', name: 'Java', slug: 'java', icon: 'Coffee' },
    { id: 'data-science', name: 'Data Science', slug: 'data-science', icon: 'BarChart3' },
    { id: 'devops', name: 'DevOps', slug: 'devops', icon: 'Server' },
    { id: 'automation', name: 'Automation', slug: 'automation', icon: 'Zap' },
];
export const TECHNOLOGIES = [
    'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte',
    'Node.js', 'Express', 'NestJS', 'FastAPI', 'Django', 'Flask', 'Spring Boot',
    'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'C++',
    'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase',
    'React Native', 'Flutter', 'Swift', 'Kotlin',
    'TensorFlow', 'PyTorch', 'scikit-learn', 'OpenCV',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'Tailwind CSS', 'Material UI', 'Chakra UI',
    'GraphQL', 'REST API', 'WebSocket',
    'Prisma', 'Drizzle', 'TypeORM',
];
export const SOLUTION_TYPES = [
    { id: 'web', label: 'Web Application', icon: 'Globe' },
    { id: 'mobile', label: 'Mobile Application', icon: 'Smartphone' },
    { id: 'ai_ml', label: 'AI / ML', icon: 'Brain' },
    { id: 'automation', label: 'Automation', icon: 'Zap' },
    { id: 'api', label: 'API', icon: 'Plug' },
    { id: 'data_analytics', label: 'Data Analytics', icon: 'BarChart3' },
    { id: 'desktop', label: 'Desktop Application', icon: 'Monitor' },
    { id: 'ui_ux', label: 'UI/UX', icon: 'Palette' },
    { id: 'other', label: 'Other', icon: 'MoreHorizontal' },
];
export const BUDGET_RANGES = [
    { id: '5000-10000', label: '₹5,000 — ₹10,000', min: 5000, max: 10000 },
    { id: '10000-25000', label: '₹10,000 — ₹25,000', min: 10000, max: 25000 },
    { id: '25000-50000', label: '₹25,000 — ₹50,000', min: 25000, max: 50000 },
    { id: '50000+', label: '₹50,000+', min: 50000, max: 200000 },
    { id: 'custom', label: 'Custom', min: 0, max: 0 },
];
export const STUDENT_LEVELS = {
    beginner: { label: 'Beginner', minProjects: 0, color: 'text-gray-500' },
    contributor: { label: 'Contributor', minProjects: 2, color: 'text-blue-500' },
    builder: { label: 'Builder', minProjects: 5, color: 'text-emerald-500' },
    expert: { label: 'Expert', minProjects: 10, color: 'text-purple-500' },
    top_developer: { label: 'Top Developer', minProjects: 20, color: 'text-amber-500' },
};
export const PLATFORM_COMMISSION = 0.10; // 10%
export const STUDENT_SIDEBAR_ITEMS = [
    { label: 'Overview', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'My Projects', href: '/projects', icon: 'FolderKanban' },
    { label: 'Tasks', href: '/tasks', icon: 'CheckSquare' },
    { label: 'Marketplace', href: '/marketplace', icon: 'Store' },
    { label: 'Solution Requests', href: '/solutions', icon: 'Lightbulb' },
    { label: 'My Proposals', href: '/proposals', icon: 'FileText' },
    { label: 'Active Contracts', href: '/contracts', icon: 'FileCheck' },
    { label: 'Messages', href: '/messages', icon: 'MessageSquare' },
    { label: 'Earnings', href: '/earnings', icon: 'Wallet' },
    { label: 'Portfolio', href: '/portfolio', icon: 'User' },
    { label: 'Reviews', href: '/reviews', icon: 'Star' },
];
export const CLIENT_SIDEBAR_ITEMS = [
    { label: 'Overview', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Browse Software', href: '/marketplace', icon: 'Store' },
    { label: 'My Requirements', href: '/solutions', icon: 'Lightbulb' },
    { label: 'Active Contracts', href: '/contracts', icon: 'FileCheck' },
    { label: 'Messages', href: '/messages', icon: 'MessageSquare' },
    { label: 'Purchases', href: '/purchases', icon: 'ShoppingBag' },
];
export const ADMIN_SIDEBAR_ITEMS = [
    { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
    { label: 'Users', href: '/admin/users', icon: 'Users' },
    { label: 'Products', href: '/admin/products', icon: 'Package' },
    { label: 'Requests', href: '/admin/requests', icon: 'Lightbulb' },
    { label: 'Transactions', href: '/admin/transactions', icon: 'CreditCard' },
    { label: 'Categories', href: '/admin/categories', icon: 'Tag' },
    { label: 'Disputes', href: '/admin/disputes', icon: 'AlertTriangle' },
    { label: 'Analytics', href: '/admin/analytics', icon: 'TrendingUp' },
    { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];
export const KANBAN_COLUMNS = [
    { id: 'backlog', title: 'Backlog', color: 'bg-gray-400' },
    { id: 'todo', title: 'Todo', color: 'bg-blue-400' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-amber-400' },
    { id: 'review', title: 'Review', color: 'bg-purple-400' },
    { id: 'done', title: 'Done', color: 'bg-green-400' },
];
export const LICENSES = [
    { id: 'MIT', name: 'MIT License', description: 'Permissive open-source license' },
    { id: 'Commercial', name: 'Commercial License', description: 'For commercial use with restrictions' },
    { id: 'Personal Use', name: 'Personal Use', description: 'For personal and educational use only' },
    { id: 'Educational', name: 'Educational', description: 'For learning and academic purposes' },
    { id: 'Custom', name: 'Custom License', description: 'Custom terms defined by the seller' },
];
