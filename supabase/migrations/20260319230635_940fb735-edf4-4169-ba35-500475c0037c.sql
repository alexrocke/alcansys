-- Fix existing project_tasks with NULL company_id by inheriting from their project
UPDATE project_tasks 
SET company_id = projects.company_id 
FROM projects 
WHERE project_tasks.project_id = projects.id 
  AND project_tasks.company_id IS NULL;