export const skillCategories = {
  'Programming Languages': [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust'
  ],
  'Frontend Development': [
    'React', 'Vue.js', 'Angular', 'Next.js', 'HTML5', 'CSS3', 'SASS/SCSS', 'Tailwind CSS', 'Material UI', 'Bootstrap',
    'Redux', 'Webpack', 'Vite', 'GraphQL', 'REST APIs', 'Responsive Design', 'Web Accessibility'
  ],
  'Backend Development': [
    'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'ASP.NET Core', 'Ruby on Rails',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'RESTful APIs', 'Microservices'
  ],
  'DevOps & Cloud': [
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI/CD', 'GitHub Actions',
    'Terraform', 'Ansible', 'Linux', 'Nginx', 'Apache'
  ],
  'Mobile Development': [
    'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Xamarin', 'Mobile UI Design',
    'App Store Optimization', 'Mobile Security'
  ],
  'Testing & QA': [
    'Jest', 'Cypress', 'Selenium', 'JUnit', 'TestNG', 'Mocha', 'Manual Testing', 'Automated Testing',
    'Performance Testing', 'Security Testing'
  ],
  'Design & UI/UX': [
    'Figma', 'Adobe XD', 'Sketch', 'UI Design', 'UX Design', 'Wireframing', 'Prototyping',
    'User Research', 'Design Systems'
  ],
  'Project Management': [
    'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence', 'Risk Management', 'Stakeholder Management',
    'Team Leadership', 'Sprint Planning'
  ],
  'Security': [
    'Cybersecurity', 'Penetration Testing', 'Security Auditing', 'OAuth', 'JWT', 'SSL/TLS',
    'Encryption', 'Security Best Practices'
  ],
  'Data Science & AI': [
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Analysis',
    'Natural Language Processing', 'Computer Vision', 'Data Visualization'
  ],
  'Version Control': [
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Branch Management', 'Code Review'
  ],
  'Soft Skills': [
    'Communication', 'Problem Solving', 'Team Collaboration', 'Time Management',
    'Critical Thinking', 'Adaptability', 'Leadership'
  ]
} as const

export type SkillCategory = keyof typeof skillCategories
export type Skill = typeof allSkills[number]

export const allSkills = Object.values(skillCategories).flat()

export const isValidSkill = (skill: string): skill is Skill => {
  return allSkills.includes(skill as Skill)
} 