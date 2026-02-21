// Create Admin Account Script
// Run with: node scripts/create-admin.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rsnmgaabkmdiderdejte.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Read from .env.local
import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
    const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    const lines = envFile.split('\n');
    for (const line of lines) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key?.trim() === 'NEXT_PUBLIC_SUPABASE_URL') {
            process.env.NEXT_PUBLIC_SUPABASE_URL = value;
        }
        if (key?.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = value;
        }
    }
} catch (e) {
    console.log('Could not read .env.local, using defaults');
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', url);

const supabase = createClient(url, key);

async function createAdminAccount() {
    const email = 'veritas9818@gmail.com';
    const password = 'Abhi@9818';

    console.log('\n🔮 Step 1: Creating account...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: 'supreme_being',
                territory_id: '770e8400-e29b-41d4-a716-446655440001',
                college_name: 'Amity University',
            }
        }
    });

    if (signUpError) {
        if (signUpError.message.includes('already registered')) {
            console.log('⚡ Account already exists. Signing in...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
                console.error('❌ Sign-in failed:', signInError.message);
                return;
            }
            console.log('✅ Signed in as:', signInData.user.id);
            console.log('\n📜 Now run this SQL in Supabase SQL Editor:');
            console.log(`\nINSERT INTO public.moderators (user_id, role, scope_type, scope_id)\nSELECT '${signInData.user.id}', 'prime_sovereign', 'global', NULL\nWHERE NOT EXISTS (\n    SELECT 1 FROM public.moderators \n    WHERE user_id = '${signInData.user.id}' \n    AND role = 'prime_sovereign'\n);`);
            return;
        }
        console.error('❌ Signup failed:', signUpError.message);
        return;
    }

    const userId = signUpData.user?.id;
    console.log('✅ Account created! User ID:', userId);

    // Try to sign in to get a proper session
    console.log('\n🔮 Step 2: Signing in...');
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({ email, password });

    if (sessionError) {
        console.log('⚠️ Auto-login failed (email might need confirmation):', sessionError.message);
        console.log('Try logging in manually at http://localhost:3000/login');
    } else {
        console.log('✅ Session established!');
    }

    console.log('\n📜 Step 3: Run this SQL in your Supabase SQL Editor to grant admin:');
    console.log('─'.repeat(60));
    console.log(`
INSERT INTO public.moderators (user_id, role, scope_type, scope_id)
SELECT '${userId}', 'prime_sovereign', 'global', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM public.moderators 
    WHERE user_id = '${userId}' 
    AND role = 'prime_sovereign'
);
    `);
    console.log('─'.repeat(60));
    console.log('\n✅ After running the SQL, log in at http://localhost:3000/login');
    console.log('   Email:', email);
    console.log('   Then go to: http://localhost:3000/admin/verifications');
}

createAdminAccount().catch(console.error);
