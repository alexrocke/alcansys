-- Approve and set admin role for alexrockefragasb@gmail.com
UPDATE profiles 
SET status = 'ativo' 
WHERE email = 'alexrockefragasb@gmail.com';

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM profiles
WHERE email = 'alexrockefragasb@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;