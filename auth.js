const SUPABASE_URL =
    "https://efjkeknzhwsyauoqsksi.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_feCrfb3oxSrozPnHXSZvWQ_a0lrB8mR";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
