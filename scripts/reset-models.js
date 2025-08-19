/**
 * Script to reset models in the database with the required default models.
 * This ensures that the GPT-4-turbo, Claude 3 Opus, and Gemini 2 Flash models are available.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envConfig = fs.existsSync(envLocalPath) 
  ? require('dotenv').parse(fs.readFileSync(envLocalPath)) 
  : {};

// Add parsed config to process.env
for (const key in envConfig) {
  process.env[key] = envConfig[key];
}

console.log('Environment loaded from .env.local');

// Default models
const defaultModels = [
  { 
    id: 'gpt-4-turbo', 
    name: 'GPT-4 Turbo', 
    provider: 'OpenAI',
    model_type: 'LLM',
    is_active: true,
    description: 'OpenAI GPT-4 Turbo model',
    version: '2024-04-09',
    context_window: 128000,
    max_tokens: 4096,
    api_key_required: true,
    authentication_type: 'Bearer',
    supports_streaming: true,
    supported_formats: ['text', 'image'],
    input_cost_per_token: 0.00001,
    output_cost_per_token: 0.00003
  },
  { 
    id: 'claude-3-opus', 
    name: 'Claude 3 Opus', 
    provider: 'Anthropic', 
    model_type: 'LLM',
    is_active: true,
    description: 'Anthropic Claude 3 Opus model',
    version: '2024-02-29',
    context_window: 200000,
    max_tokens: 4096,
    api_key_required: true,
    authentication_type: 'Bearer',
    supports_streaming: true,
    supported_formats: ['text', 'image'],
    input_cost_per_token: 0.000015,
    output_cost_per_token: 0.000075
  },
  { 
    id: 'gemini-2-flash', 
    name: 'Gemini 2 Flash', 
    provider: 'Google', 
    model_type: 'LLM',
    is_active: true,
    description: 'Google Gemini 2 Flash model',
    version: 'experimental',
    context_window: 1000000,
    max_tokens: 8192,
    api_key_required: true,
    authentication_type: 'Bearer',
    supports_streaming: true,
    supported_formats: ['text', 'image', 'audio', 'video'],
    input_cost_per_token: 0.0000001,
    output_cost_per_token: 0.0000004
  }
];

async function resetModels() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL and key must be set in environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // First, delete all existing models
    console.log('Deleting existing models...');
    const { error: deleteError } = await supabase.from('ai_models').delete().neq('id', 'dummy');
    
    if (deleteError) {
      console.error('Error deleting models:', deleteError);
      return;
    }
    
    // Then insert the default models
    console.log('Adding default models...');
    const { data, error } = await supabase.from('ai_models').insert(defaultModels).select();
    
    if (error) {
      console.error('Error inserting models:', error);
      return;
    }
    
    console.log('Successfully reset models. Added models:');
    console.log(data.map(model => model.name).join(', '));
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

resetModels()
  .then(() => console.log('Script completed'))
  .catch(error => console.error('Script failed:', error));
