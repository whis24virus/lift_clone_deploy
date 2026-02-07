-- Create a default user for the app
INSERT INTO users (id, username, password_hash) 
VALUES ('763b9c95-4bae-4044-9d30-7ae513286b37', 'default_user', 'not_used')
ON CONFLICT (id) DO NOTHING;
