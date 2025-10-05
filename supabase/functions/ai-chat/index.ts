import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    
    // Debug logging
    console.log('📊 Received context:', JSON.stringify(context, null, 2));
    
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
- **ACTUALLY CREATE AND EXECUTE TASKS** - You have real functions you can call!
- Be friendly, helpful, and proactive in taking action

## Your Capabilities - YOU CAN DO THESE:

### Function Calling Powers:
1. **create_task** - Create real tasks in the database when users ask
2. **execute_task** - Actually execute tasks when users want them run
3. **get_mining_stats** - Fetch real-time mining data from SupportXMR
4. **log_activity** - Track your actions for transparency
5. **query_tasks** - Read tasks from the database, filter by status
6. **query_logs** - View your own activity logs and system logs
7. **query_agents** - Check agent information and status
8. **query_conversations** - Access conversation history
9. **query_repos** - Look up repository information

**IMPORTANT**: When users ask you to "check tasks", "show me logs", "what agents do we have", or similar questions, USE THESE FUNCTIONS to actually query the database and give them real data. You're not just a chatbot - you have direct database access!

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
      
      const formatXMR = (atomicUnits: string | number): string => {
        const num = typeof atomicUnits === 'string' ? parseFloat(atomicUnits || '0') : (atomicUnits || 0);
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

    // Define tools that Eliza can use
    const tools = [
      {
        type: "function",
        function: {
          name: "create_task",
          description: "Create a new task in the autonomous task system. Use this when users ask you to create tasks, track actions, or organize work.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Task title" },
              description: { type: "string", description: "Task description" },
              task_type: { type: "string", enum: ["github_operation", "repository_analysis", "ecosystem_management", "general"], description: "Type of task" },
            },
            required: ["title", "description", "task_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "execute_task",
          description: "Execute a pending task by its ID. Use this when users ask you to run, execute, or start a task.",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "UUID of the task to execute" }
            },
            required: ["task_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_mining_stats",
          description: "Get real-time mining statistics from SupportXMR pool. Use this when users ask about current mining performance.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "log_activity",
          description: "Log your activity to the activity log. Use this to track what you're doing for transparency.",
          parameters: {
            type: "object",
            properties: {
              activity_type: { type: "string", description: "Type of activity (e.g., task_creation, analysis, system_check)" },
              title: { type: "string", description: "Activity title" },
              description: { type: "string", description: "Activity description" },
              metadata: { type: "object", description: "Additional metadata" }
            },
            required: ["activity_type", "title"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_tasks",
          description: "Query tasks from the database. Can filter by status, category, or get all tasks.",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", description: "Filter by task status (PENDING, IN_PROGRESS, COMPLETED, etc.)" },
              limit: { type: "number", description: "Maximum number of tasks to return (default 10)" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_logs",
          description: "Query activity logs to see what actions have been performed.",
          parameters: {
            type: "object",
            properties: {
              activity_type: { type: "string", description: "Filter by activity type" },
              limit: { type: "number", description: "Maximum number of logs to return (default 20)" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_agents",
          description: "Query agent information to see available agents and their capabilities.",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", description: "Filter by agent status" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_conversations",
          description: "Query recent conversation messages and sessions.",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Maximum number of messages to return (default 10)" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_repos",
          description: "Query repository information from the repos table.",
          parameters: {
            type: "object",
            properties: {
              category: { type: "string", description: "Filter by repository category" }
            },
            required: []
          }
        }
      }
    ];

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
        tools: tools,
        tool_choice: "auto"
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
    const message = data.choices?.[0]?.message;

    console.log('AI Gateway response received');

    // Handle tool calls if present
    if (message?.tool_calls && message.tool_calls.length > 0) {
      console.log('Processing tool calls:', message.tool_calls.length);
      const toolResults = [];
      
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, functionArgs);
        let result;
        
        try {
          switch (functionName) {
            case 'create_task':
              result = await handleCreateTask(functionArgs);
              break;
            case 'execute_task':
              result = await handleExecuteTask(functionArgs);
              break;
            case 'get_mining_stats':
              result = await handleGetMiningStats();
              break;
            case 'log_activity':
              result = await handleLogActivity(functionArgs);
              break;
            case 'query_tasks':
              result = await handleQueryTasks(functionArgs);
              break;
            case 'query_logs':
              result = await handleQueryLogs(functionArgs);
              break;
            case 'query_agents':
              result = await handleQueryAgents(functionArgs);
              break;
            case 'query_conversations':
              result = await handleQueryConversations(functionArgs);
              break;
            case 'query_repos':
              result = await handleQueryRepos(functionArgs);
              break;
            default:
              result = { error: `Unknown function: ${functionName}` };
          }
        } catch (error) {
          console.error(`Error executing ${functionName}:`, error);
          result = { error: error.message };
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          function_name: functionName,
          result: result
        });
      }
      
      // Build a response that includes both the AI's message and tool results
      const responseMessage = message.content || "I've executed the requested actions. Here are the results:";
      const toolSummary = toolResults.map(tr => 
        `\n- ${tr.function_name}: ${tr.result.success ? '✅ Success' : '❌ Failed'} ${tr.result.message || tr.result.error || ''}`
      ).join('');
      
      return new Response(
        JSON.stringify({ 
          response: responseMessage + toolSummary,
          tool_calls: toolResults,
          model,
          success: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Normal response without tool calls
    const responseText = message?.content || 'I apologize, but I could not generate a response.';

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

// Tool handler functions
async function handleCreateTask(args: any) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const taskId = crypto.randomUUID();
  const { data, error } = await supabaseClient
    .from('tasks')
    .insert({
      id: taskId,
      title: args.title,
      description: args.description,
      category: args.task_type,
      status: 'PENDING',
      stage: 'planning',
      repo: 'xmrt-dao',
      priority: 5
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return { success: false, error: error.message };
  }

  // Log the activity
  await supabaseClient.from('eliza_activity_log').insert({
    activity_type: 'task_creation',
    title: `Created task: ${args.title}`,
    description: args.description,
    status: 'completed',
    metadata: { task_id: taskId, task_type: args.task_type }
  });

  return { success: true, task_id: taskId, data };
}

async function handleExecuteTask(args: any) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: task, error: fetchError } = await supabaseClient
    .from('tasks')
    .select('*')
    .eq('id', args.task_id)
    .single();

  if (fetchError || !task) {
    return { success: false, error: 'Task not found' };
  }

  // Update task status to IN_PROGRESS
  const { error: updateError } = await supabaseClient
    .from('tasks')
    .update({ status: 'IN_PROGRESS', stage: 'executing' })
    .eq('id', args.task_id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Create task execution record
  const executionId = crypto.randomUUID();
  await supabaseClient.from('task_executions').insert({
    id: executionId,
    task_id: args.task_id,
    status: 'running',
    metadata: { started_at: new Date().toISOString() }
  });

  // Log the activity
  await supabaseClient.from('eliza_activity_log').insert({
    activity_type: 'task_execution',
    title: `Executing task: ${task.title}`,
    description: `Started execution of task ${args.task_id}`,
    status: 'completed',
    metadata: { task_id: args.task_id, execution_id: executionId }
  });

  return { 
    success: true, 
    task_id: args.task_id, 
    execution_id: executionId,
    message: 'Task execution started' 
  };
}

async function handleGetMiningStats() {
  const walletAddress = Deno.env.get('MINER_WALLET_ADDRESS') || 
    '46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzSqxzDQtNLf2bsp2DX2qCCgC5mg';
  
  try {
    const response = await fetch(`https://supportxmr.com/api/miner/${walletAddress}/stats`);
    const data = await response.json();
    
    return {
      success: true,
      stats: {
        hashrate: data.hash || 0,
        total_hashes: data.totalHashes || 0,
        valid_shares: data.validShares || 0,
        amt_due: data.amtDue || 0,
        amt_paid: data.amtPaid || 0,
        last_hash: data.lastHash || 0,
        wallet_address: walletAddress
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleLogActivity(args: any) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabaseClient
    .from('eliza_activity_log')
    .insert({
      activity_type: args.activity_type,
      title: args.title,
      description: args.description || null,
      status: 'completed',
      metadata: args.metadata || {}
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function handleQueryTasks(args: any) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let query = supabaseClient
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(args.limit || 10);

  if (args.status) {
    query = query.eq('status', args.status);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, count: data.length, tasks: data };
}

async function handleQueryLogs(args: any) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let query = supabaseClient
    .from('eliza_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(args.limit || 20);

  if (args.activity_type) {
    query = query.eq('activity_type', args.activity_type);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, count: data.length, logs: data };
}

async function handleQueryAgents(args: any) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let query = supabaseClient
    .from('agents')
    .select('*');

  if (args.status) {
    query = query.eq('status', args.status);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, count: data.length, agents: data };
}

async function handleQueryConversations(args: any) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabaseClient
    .from('conversation_messages')
    .select('id, content, message_type, timestamp, session_id')
    .order('timestamp', { ascending: false })
    .limit(args.limit || 10);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, count: data.length, messages: data };
}

async function handleQueryRepos(args: any) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let query = supabaseClient
    .from('repos')
    .select('*');

  if (args.category) {
    query = query.eq('category', args.category);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, count: data.length, repos: data };
}
