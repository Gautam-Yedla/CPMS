const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAdminAssignment() {
    console.log('--- Checking User Roles ---');

    const { data: userRoles, error: urError } = await supabase.from('user_roles').select('*');
    console.log('user_roles:', userRoles, urError ? urError : '');

    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, full_name, email, role');
    console.log('profiles:', profiles, pError ? pError : '');
}

checkAdminAssignment();
