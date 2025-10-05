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

    // Build system prompt with XMRT context
    let systemPrompt = `You are Eliza, an AI assistant for XMRT DAO, a decentralized mobile mining ecosystem powered by Monero (XMR).

Your role is to:
- Help users understand mobile Monero mining
- Provide information about XMRT DAO governance and tokens
- Answer questions about mining statistics and performance
- Guide users through the ecosystem
- Be friendly, helpful, and knowledgeable about privacy-preserving technology

Keep responses concise, clear, and actionable.`;

    // Add context if provided
    if (context?.miningStats) {
      const stats = context.miningStats;
      systemPrompt += `\n\nCurrent Mining Context:
- Hashrate: ${stats.hash || 0} H/s
- Total Hashes: ${stats.totalHashes || 0}
- Valid Shares: ${stats.validShares || 0}
- Amount Due: ${stats.amtDue || '0'} XMR
- Amount Paid: ${stats.amtPaid || '0'} XMR`;
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
