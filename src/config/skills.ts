export const skillCategories = {
  'Frontend Development': [
    'React',
    'Next.js',
    'Vue.js',
    'Angular',
    'TypeScript',
    'JavaScript',
    'HTML5',
    'CSS3',
    'SASS/SCSS',
    'Tailwind CSS',
    'Material UI',
    'Redux',
    'Responsive Design',
    'Web Performance',
    'Progressive Web Apps'
  ],
  'Backend Development': [
    'Node.js',
    'Python',
    'Java',
    'C#',
    'PHP',
    'Ruby',
    'Go',
    'Express.js',
    'Django',
    'Spring Boot',
    'ASP.NET Core',
    'Laravel',
    'Ruby on Rails',
    'GraphQL',
    'REST API Design'
  ],
  'Database': [
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'Elasticsearch',
    'SQL Server',
    'Oracle',
    'Firebase',
    'DynamoDB',
    'Cassandra',
    'Database Design',
    'Data Modeling',
    'Query Optimization'
  ],
  'DevOps & Infrastructure': [
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'Google Cloud',
    'Linux',
    'CI/CD',
    'Jenkins',
    'GitHub Actions',
    'Terraform',
    'Ansible',
    'Monitoring',
    'Logging',
    'Security',
    'Performance Tuning'
  ],
  'Project Management': [
    'Agile',
    'Scrum',
    'Kanban',
    'JIRA',
    'Confluence',
    'Risk Management',
    'Stakeholder Management',
    'Resource Planning',
    'Sprint Planning',
    'Project Estimation'
  ],
  'Design & UX': [
    'UI Design',
    'UX Design',
    'Figma',
    'Adobe XD',
    'Sketch',
    'Wireframing',
    'Prototyping',
    'User Research',
    'Usability Testing',
    'Information Architecture',
    'Design Systems'
  ],
  'Quality Assurance': [
    'Manual Testing',
    'Automated Testing',
    'Jest',
    'Cypress',
    'Selenium',
    'Test Planning',
    'Test Cases',
    'Performance Testing',
    'Security Testing',
    'API Testing',
    'Load Testing'
  ],
  'Mobile Development': [
    'React Native',
    'Flutter',
    'iOS Development',
    'Android Development',
    'Swift',
    'Kotlin',
    'Mobile UI Design',
    'App Performance',
    'Mobile Security',
    'Push Notifications'
  ],
  'AI & Machine Learning': [
    'Machine Learning',
    'Deep Learning',
    'Natural Language Processing',
    'Computer Vision',
    'TensorFlow',
    'PyTorch',
    'Data Analysis',
    'Statistical Analysis',
    'Model Training',
    'AI Integration'
  ],
  'Soft Skills': [
    'Communication',
    'Problem Solving',
    'Team Leadership',
    'Time Management',
    'Critical Thinking',
    'Collaboration',
    'Adaptability',
    'Mentoring',
    'Presentation Skills',
    'Technical Writing'
  ]
} as const

// Create a flat array of all skills for easy lookup
export const allSkills = Object.values(skillCategories).flat()

// Type for skill categories
export type SkillCategory = keyof typeof skillCategories

// Type for individual skills
export type Skill = typeof allSkills[number]

export const isValidSkill = (skill: string): skill is Skill => {
  return allSkills.includes(skill as Skill)
} 