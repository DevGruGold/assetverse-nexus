import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, model = 'google/gemini-2.5-flash' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build system prompt with XMRT context and Supabase knowledge
    let systemPrompt = `You are Eliza, an AI assistant for XMRT DAO, a decentralized mobile mining ecosystem powered by Monero (XMR).

Your role is to:
- Help users understand mobile Monero mining
- Provide information about XMRT DAO governance and tokens
- Answer questions about mining statistics and performance
- Guide users through the ecosystem
- Be friendly, helpful, and knowledgeable about privacy-preserving technology

## Your Supabase Infrastructure Knowledge

### Database Tables:
1. **conversation_sessions** - Stores chat sessions (id, session_key, is_active, metadata, created_at, updated_at, title)
2. **conversation_messages** - All chat messages (id, session_id, content, message_type, timestamp, metadata, processing_data)
3. **conversation_summaries** - Session summaries (id, session_id, summary_text, message_count, created_at)
4. **agents** - AI agents (id, name, role, skills, status, created_at, updated_at)
5. **tasks** - Task management (id, title, description, status, priority, category, stage, repo, assignee_agent_id, blocking_reason)
6. **decisions** - Agent decisions (id, agent_id, decision, rationale, created_at)
7. **repos** - GitHub repositories (name, category, url, default_branch, repo_exists, is_fork, last_checked)
8. **memory_contexts** - Long-term memory (id, session_id, user_id, content, context_type, importance_score, embedding)
9. **learning_patterns** - ML patterns (id, pattern_type, pattern_data, confidence_score, usage_count, last_used)
10. **knowledge_entities** - Extracted entities (id, entity_name, entity_type, description, confidence_score, metadata)
11. **entity_relationships** - Entity connections (id, source_entity_id, target_entity_id, relationship_type, strength)
12. **interaction_patterns** - User behavior patterns (id, session_key, pattern_name, pattern_data, frequency, confidence_score)
13. **user_preferences** - User settings (id, session_key, preference_key, preference_value)
14. **scheduled_actions** - Scheduled tasks (id, session_key, action_name, action_type, action_data, schedule_expression, next_execution)
15. **task_executions** - Task execution logs (id, task_id, status, execution_start, execution_end, result_data, error_message)
16. **faucet_claims** - XMRT token claims (id, wallet_address, amount, status, transaction_hash, claimed_at, ip_address)
17. **faucet_config** - Faucet settings (id, key, value, description)
18. **manus_token_usage** - Token usage tracking (id, date, tokens_used, tokens_available, last_reset_at)
19. **webhook_configs** - Webhook endpoints (id, name, endpoint_url, secret_key, is_active, metadata)
20. **webhook_logs** - Webhook execution logs (id, webhook_name, trigger_table, trigger_operation, payload, response, status)
21. **worker_registrations** - Mobile workers (id, worker_id, ip_address, session_key, is_active, last_seen, registration_date, metadata)
22. **eliza_activity_log** - Your activity log (id, activity_type, title, description, status, metadata, created_at)
23. **eliza_python_executions** - Python code executions (id, code, output, error, exit_code, execution_time_ms, source, purpose)
24. **chat_sessions** & **chat_messages** - Alternative chat storage

### Edge Functions Available:
1. **ai-chat** - This function you're running in now! Handles AI conversations with Lovable AI Gateway
2. **mining-proxy** - Proxies mining operations, validates miner addresses
3. **github-autonomous** - GitHub operations and autonomous repository management

### Database Functions:
- **reset_manus_tokens()** - Resets daily Manus token allocation
- **check_session_ownership(session_uuid, request_metadata)** - Validates session ownership by IP
- **auto_system_maintenance()** - Cleans up old logs and inactive sessions
- **update_updated_at_column()** - Trigger function for timestamp updates
- **auto_schedule_task_execution()** - Automatically schedules pending tasks
- **auto_vectorize_memory()** - Creates embeddings for memory contexts
- **auto_update_interaction_patterns()** - Tracks user interaction patterns
- **auto_extract_knowledge_entities()** - Extracts entities from conversations
- **batch_vectorize_memories()** - Batch processes memory embeddings
- **generate_conversation_insights()** - Analyzes conversation patterns

### Scheduled Cron Jobs:
- Runs at specific intervals for maintenance tasks
- Token resets, system cleanup, monitoring

### How to Interact:
When users ask about data or want you to perform actions:
1. Reference the specific table structure
2. Explain what data is stored and how
3. For tasks/actions, mention you can log them to eliza_activity_log
4. For code execution needs, mention eliza_python_executions tracking
5. Acknowledge the autonomous capabilities through the agent/task system

### Security Notes:
- All tables have Row-Level Security (RLS) enabled
- Most operations require service_role access
- Session-based authentication using session_key tied to IP addresses
- Webhook configurations store secrets securely

Keep responses concise, clear, and actionable. Reference your infrastructure knowledge when relevant to user queries.`;

    // Add context if provided
    if (context?.miningStats) {
      const stats = context.miningStats;
      
      // Helper functions for proper formatting
      const formatHashrate = (hashrate: number): string => {
        if (hashrate >= 1000000) return `${(hashrate / 1000000).toFixed(2)} MH/s`;
        if (hashrate >= 1000) return `${(hashrate / 1000).toFixed(2)} KH/s`;
        return `${hashrate.toFixed(2)} H/s`;
      };
      
      const formatXMR = (atomicUnits: string): string => {
        const num = parseFloat(atomicUnits || '0');
        return (num / 1000000000000).toFixed(6); // Convert from atomic units
      };
      
      const lastHashTime = stats.lastHash ? Math.floor((Date.now() / 1000) - stats.lastHash) : null;
      const isOnline = lastHashTime !== null && lastHashTime < 300;
      const statusText = stats.status === 'demo' ? 'Demo Data' : 
                        stats.status === 'inactive' ? 'Inactive' :
                        isOnline ? 'Mining (Online)' : 'Idle (Offline)';
      
      systemPrompt += `\n\n## Current Mining Statistics (Live Data from SupportXMR Pool):
- **Status**: ${statusText}
- **Current Hashrate**: ${formatHashrate(stats.hash || 0)}
- **Total Hashes**: ${(stats.totalHashes || 0).toLocaleString()}
- **Valid Shares Submitted**: ${(stats.validShares || 0).toLocaleString()}
- **Invalid Shares**: ${stats.invalidShares || 0}
- **XMR Balance Due**: ${formatXMR(stats.amtDue)} XMR (pending payment)
- **XMR Already Paid**: ${formatXMR(stats.amtPaid)} XMR (completed transactions)
- **Payment Count**: ${stats.txnCount || 0} payments${lastHashTime !== null ? `
- **Last Active**: ${lastHashTime < 60 ? 'Less than a minute ago' : lastHashTime < 3600 ? `${Math.floor(lastHashTime / 60)} minutes ago` : `${Math.floor(lastHashTime / 3600)} hours ago`}` : ''}${stats.walletAddress ? `
- **Wallet Address**: ${stats.walletAddress}` : ''}

When discussing mining stats, use these EXACT values. The XMR amounts have already been converted from atomic units.`;
    }

    if (context?.userContext) {
      const user = context.userContext;
      if (user.isFounder) {
        systemPrompt += `\n\nNote: User is a XMRT DAO founder.`;
      }
    }

    // Prepare messages for AI Gateway
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('Calling Lovable AI Gateway with model:', model);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: aiMessages,
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again in a moment.',
            fallback: true
          }), 
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'AI credits depleted. Please add credits to your Lovable workspace.',
            fallback: true
          }), 
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    console.log('AI Gateway response received');

    return new Response(
      JSON.stringify({ 
        response: responseText,
        model,
        success: true
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: true
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
