const fs = require('fs');

try {
  let c = fs.readFileSync('src/app/api/chat/route.ts', 'utf8');

  // 1) Split the prompt
  // Replace windows newlines or unix newlines
  c = c.replace(
    /keep everything conversational[\r\n]+=== FINAL DIAGNOSIS OUTPUT ===/,
    'keep everything conversational`;\n\nconst FINAL_DIAGNOSIS_OUTPUT_RULES = `=== FINAL DIAGNOSIS OUTPUT ==='
  );

  // 2) Append back ONLY if not Q&A
  const targetUsage = '        if (personaContext) {';
  let replacementUsage = `        if (isFinalTurn && typeof FINAL_DIAGNOSIS_OUTPUT_RULES !== 'undefined') {\n            finalSystemPrompt += '\\n\\n' + FINAL_DIAGNOSIS_OUTPUT_RULES;\n        }\n\n        if (personaContext) {`;
  
  if (c.includes(replacementUsage)) {
      console.log('Usage already injected.');
  } else {
      c = c.replace(targetUsage, replacementUsage);
  }

  // 3) We also know that earlier, Phase A turns were 200 tokens. And Phase B was 350.
  // Wait, the user said "Reduce time of everything make it as fast as possible by a machine".
  // The token output budget is `maxTokens`. 200 tokens output gets generated fast.
  // We can reduce max history array length for turns 1-3. Currently it is MAX_MESSAGES=15.
  // We don't need 15 messages of context for early turns! That's up to ~2k tokens of context.
  
  const ctxLimitOld = '        const processedMessages = messages.length > MAX_MESSAGES \n            ? messages.slice(messages.length - MAX_MESSAGES) \n            : messages;';
  
  const ctxLimitNew = `        // DYNAMIC CONTEXT WINDOW (Latency Optimization)
        // Early turns only need the last few messages. Final diagnosis needs more history.
        let dynamicMaxMessages = MAX_MESSAGES;
        const userTurnsEarly = messages.filter(m => m.role === 'user').length;
        if (userTurnsEarly <= 2) dynamicMaxMessages = 4;        // ~2 turns of history
        else if (userTurnsEarly <= 5) dynamicMaxMessages = 8;   // ~4 turns of history
        
        const processedMessages = messages.length > dynamicMaxMessages 
            ? messages.slice(messages.length - dynamicMaxMessages) 
            : messages;`;
            
  if (c.includes(ctxLimitOld)) {
      c = c.replace(ctxLimitOld, ctxLimitNew);
      console.log('Injected dynamic context window');
  }

  fs.writeFileSync('src/app/api/chat/route.ts', c, 'utf8');
  console.log('Success TTFT Fix');
} catch (e) {
  console.error(e);
}
