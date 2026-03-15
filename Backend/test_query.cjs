const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.from('user_roles').select('user_id, role_id, roles(name)');
    console.log('Error:', error);
    console.log('Data:', data);
}
run();
