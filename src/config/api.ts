export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
 
export const API_ROUTES = {
  projects: {
    employees: (projectId: string) => `/api/projects/${projectId}/employees`,
  }
} as const; 