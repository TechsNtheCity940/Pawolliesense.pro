import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://vponnmvroyythlggqnhc.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRjMjQzNDJhLWVkYzYtNDRmMC04ZGM5LWI5M2UzMWVhZTQyMCJ9.eyJwcm9qZWN0SWQiOiJ2cG9ubm12cm95eXRobGdncW5oYyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY1ODM3Mjk5LCJleHAiOjIwODExOTcyOTksImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.7YU0tsNWcJggrBOPjkKTsgPtWVNMIjeyyUdP04CEaaY';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };