// import { createClient } from '@supabase/supabase-js';
// import dotenv from 'dotenv';
// dotenv.config();
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// (async () => {
//     const { data } = await supabase.from('camera_detections').select('metadata').order('timestamp', { ascending: false }).limit(2);
//     for (const row of data) {
//         const meta = row.metadata;
//         console.log('Filename:', meta.filename);
//         console.log('Original image exists:', !!meta.original_image_base64);
//         if (meta.original_image_base64) {
//             console.log('Length:', meta.original_image_base64.length);
//         }
//         console.log('-----------');
//     }
// })();
