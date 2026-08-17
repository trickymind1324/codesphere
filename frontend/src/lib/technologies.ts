/**
 * Canonical technology list for the skills typeahead, with aliases so partial
 * or informal input maps to the proper name (e.g. "go" → Golang, "pyth" →
 * Python, "kon" → Kong).
 */
export interface Tech {
  name: string;
  aliases?: string[];
}

export const TECHNOLOGIES: Tech[] = [
  { name: 'Python', aliases: ['py', 'python3'] },
  { name: 'JavaScript', aliases: ['js', 'ecmascript'] },
  { name: 'TypeScript', aliases: ['ts'] },
  { name: 'Golang', aliases: ['go', 'golang'] },
  { name: 'Java' },
  { name: 'C', aliases: ['clang'] },
  { name: 'C++', aliases: ['cpp', 'cplusplus'] },
  { name: 'C#', aliases: ['csharp', 'dotnet', '.net'] },
  { name: 'Rust', aliases: ['rs'] },
  { name: 'Ruby', aliases: ['rb'] },
  { name: 'PHP' },
  { name: 'Kotlin', aliases: ['kt'] },
  { name: 'Swift' },
  { name: 'Scala' },
  { name: 'R' },
  { name: 'Dart' },
  { name: 'Elixir' },
  { name: 'Haskell' },
  { name: 'SQL' },
  { name: 'PostgreSQL', aliases: ['postgres', 'psql'] },
  { name: 'MySQL' },
  { name: 'SQLite' },
  { name: 'MongoDB', aliases: ['mongo'] },
  { name: 'Redis', aliases: ['red'] },
  { name: 'Elasticsearch', aliases: ['elastic', 'es'] },
  { name: 'Cassandra' },
  { name: 'DynamoDB' },
  { name: 'Kafka' },
  { name: 'RabbitMQ' },
  { name: 'GraphQL', aliases: ['gql'] },
  { name: 'REST' },
  { name: 'gRPC' },
  { name: 'React', aliases: ['reactjs'] },
  { name: 'Next.js', aliases: ['nextjs', 'next'] },
  { name: 'Vue', aliases: ['vuejs'] },
  { name: 'Angular' },
  { name: 'Svelte' },
  { name: 'Node.js', aliases: ['node', 'nodejs'] },
  { name: 'Express', aliases: ['expressjs'] },
  { name: 'NestJS', aliases: ['nest'] },
  { name: 'Django' },
  { name: 'Flask' },
  { name: 'FastAPI' },
  { name: 'Spring', aliases: ['springboot', 'spring boot'] },
  { name: 'Rails', aliases: ['ruby on rails', 'ror'] },
  { name: 'Laravel' },
  { name: '.NET', aliases: ['dotnet'] },
  { name: 'Tailwind CSS', aliases: ['tailwind'] },
  { name: 'Docker' },
  { name: 'Kubernetes', aliases: ['k8s', 'kube'] },
  { name: 'Kong' },
  { name: 'Nginx' },
  { name: 'Terraform', aliases: ['tf'] },
  { name: 'Ansible' },
  { name: 'AWS', aliases: ['amazon web services'] },
  { name: 'Google Cloud', aliases: ['gcp'] },
  { name: 'Azure' },
  { name: 'Keycloak' },
  { name: 'Kafka' },
  { name: 'Prometheus' },
  { name: 'Grafana' },
  { name: 'Git' },
  { name: 'Linux' },
  { name: 'Bash', aliases: ['shell', 'sh'] },
  { name: 'CI/CD', aliases: ['cicd'] },
  { name: 'GitHub Actions' },
  { name: 'Machine Learning', aliases: ['ml'] },
  { name: 'TensorFlow', aliases: ['tf'] },
  { name: 'PyTorch', aliases: ['torch'] },
  { name: 'Pandas' },
  { name: 'NumPy', aliases: ['numpy'] },
];

/** Suggest technologies by name or alias prefix/substring. */
export function suggestTechnologies(query: string, exclude: string[] = [], limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const has = new Set(exclude.map((s) => s.toLowerCase()));
  const starts: string[] = [];
  const contains: string[] = [];
  for (const t of TECHNOLOGIES) {
    if (has.has(t.name.toLowerCase())) continue;
    const keys = [t.name.toLowerCase(), ...(t.aliases ?? [])];
    if (keys.some((k) => k.startsWith(q))) starts.push(t.name);
    else if (keys.some((k) => k.includes(q))) contains.push(t.name);
  }
  return [...starts, ...contains].slice(0, limit);
}
