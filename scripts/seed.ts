import db, { createAlternative } from '../src/lib/db';

const seedData = [
  {
    name: 'Nanobot',
    description: 'Lightweight, auditable Python-based AI agent with ~4K lines of code.',
    fullDescription: 'Nanobot is a popular open-source AI agent built in Python, known for its lightweight and auditable codebase. With approximately 4,000 lines of code, it offers transparency and ease of modification for developers who want to understand and customize their AI agent.',
    githubUrl: 'https://github.com',
    stars: 24793,
    language: 'Python',
    category: 'popular',
    security: 'workspace-isolation',
    deployment: ['local', 'docker'],
    hardware: ['x86_64', 'arm64', 'raspberry-pi'],
    useCases: ['personal', 'development', 'automation'],
    features: ['Lightweight', 'Auditable', 'Python-based', 'Customizable', 'Active community'],
  },
  {
    name: 'ZeroClaw',
    description: 'Ultra-low resource Rust-based agent running on 5MB RAM, perfect for edge devices.',
    githubUrl: 'https://github.com',
    stars: 18877,
    language: 'Rust',
    category: 'lightweight',
    security: 'workspace-isolation',
    deployment: ['local', 'embedded'],
    hardware: ['x86_64', 'arm64', 'esp32', 'raspberry-pi', 'risc-v'],
    useCases: ['personal', 'iot', 'embedded'],
    features: ['Ultra-low RAM', 'Rust-based', 'Edge computing', 'IoT optimized'],
  },
  {
    name: 'OpenAgent',
    description: 'Full-featured TypeScript agent with extensive plugin ecosystem.',
    githubUrl: 'https://github.com',
    stars: 12450,
    language: 'TypeScript',
    category: 'popular',
    security: 'sandboxed',
    deployment: ['local', 'cloud', 'docker'],
    hardware: ['x86_64', 'arm64', 'cloud-only'],
    useCases: ['development', 'automation', 'enterprise'],
    features: ['Plugin ecosystem', 'TypeScript', 'REST API', 'Webhooks'],
  },
  {
    name: 'RustClaw',
    description: 'High-performance Rust agent with minimal dependencies and maximum speed.',
    githubUrl: 'https://github.com',
    stars: 8234,
    language: 'Rust',
    category: 'lightweight',
    security: 'minimal-permissions',
    deployment: ['local', 'embedded'],
    hardware: ['x86_64', 'arm64', 'risc-v'],
    useCases: ['development', 'automation'],
    features: ['Zero dependencies', 'Blazing fast', 'Small binary'],
  },
  {
    name: 'EnterpriseClaw',
    description: 'Enterprise-grade agent with SSO, audit logs, and compliance features.',
    githubUrl: 'https://github.com',
    stars: 5678,
    language: 'Go',
    category: 'enterprise',
    security: 'sandboxed',
    deployment: ['local', 'cloud', 'docker'],
    hardware: ['x86_64', 'arm64', 'cloud-only'],
    useCases: ['enterprise', 'automation'],
    features: ['SSO', 'Audit logging', 'Compliance reports', 'Role-based access'],
  },
];

console.log('Seeding database...');

for (const data of seedData) {
  try {
    createAlternative({
      name: data.name,
      description: data.description,
      fullDescription: data.fullDescription,
      githubUrl: data.githubUrl,
      language: data.language,
      category: data.category,
      security: data.security,
      deployment: data.deployment,
      hardware: data.hardware,
      useCases: data.useCases,
      features: data.features,
      submittedBy: 'system',
    });

    // Update stars (direct SQL for this demo)
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    db.prepare('UPDATE alternatives SET stars = ? WHERE slug = ?').run(data.stars, slug);

    // Also update status to approved for seed data
    db.prepare('UPDATE alternatives SET status = ? WHERE slug = ?').run('approved', slug);

    console.log(`Created: ${data.name}`);
  } catch (error) {
    console.error(`Failed to create ${data.name}:`, error);
  }
}

console.log('Seeding complete!');
