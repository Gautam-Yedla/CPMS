
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'd:/CPMS/Backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function check() {
    console.log('Using URL:', process.env.SUPABASE_URL);
    
    console.log('\n--- ROLES ---');
    const { data: roles } = await supabase.from('roles').select('*');
    console.log(JSON.stringify(roles, null, 2));

    console.log('\n--- ADMIN USER ROLES ---');
    const adminRole = roles?.find(r => r.name === 'Admin' || r.name === 'admin');
    if (adminRole) {
        const { data: userRoles } = await supabase.from('user_roles').select('*, profiles(full_name, email)').eq('role_id', adminRole.id);
        console.log(JSON.stringify(userRoles, null, 2));
    } else {
        console.log('No Admin role found in roles table.');
    }

    console.log('\n--- ALL PROFILES ---');
    const { data: profiles } = await supabase.from('profiles').select('*').limit(5);
    console.log(JSON.stringify(profiles, null, 2));
}

check();
