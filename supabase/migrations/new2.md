My AI chatbot application is cutting off / stopping midway through generating 
responses. I need you to investigate and identify the root cause(s).

CONTEXT TO GATHER FIRST
1. Scan the project structure to understand the stack (frontend framework, 
   backend framework/language, which LLM API is used, whether streaming is 
   implemented).
2. Find the code that calls the LLM API (chat completion / messages endpoint) 
   and the code that streams/renders the response to the user.
3. Check for any logs, error files, or console output related to failed or 
   truncated responses.

AREAS TO INVESTIGATE (check all, report findings for each)

1. Token / length limits
   - Is max_tokens (or equivalent) set too low, silently truncating output?
   - Is the conversation history exceeding the model's context window, 
     causing truncation or errors?

2. Streaming implementation
   - If using streaming (SSE / WebSockets), is the stream being closed 
     prematurely by the client or server?
   - Are stream "done"/"stop" events being misinterpreted as errors, or 
     vice versa?
   - Is there a connection/idle timeout (proxy, load balancer, server, or 
     browser) that's shorter than typical response time?

3. Error handling
   - Are API errors (rate limits, timeouts, network drops) being silently 
     swallowed instead of surfaced or retried?
   - Is there a try/catch that exits without completing the response?

4. Timeouts
   - Backend request timeout settings (server framework, reverse proxy 
     like Nginx, serverless function timeout limits, etc.)
   - Frontend fetch/XHR timeout settings.
   - Any hard timeout imposed by hosting provider (e.g. serverless 
     max execution time).

5. Infrastructure / deployment
   - If deployed on serverless (Lambda, Vercel, Cloud Functions), check 
     execution time limits vs. typical response generation time.
   - If behind a reverse proxy or CDN, check for buffering or timeout 
     settings that could cut long-running streams.

6. Client-side rendering
   - Is the frontend correctly appending streamed chunks, or does it stop 
     listening after a certain event/condition?
   - Any state management bug that could stop rendering mid-stream 
     (e.g. component unmount, re-render wiping state)?

7. Rate limiting / quota
   - Check whether responses are being cut off due to hitting API rate 
     limits or usage quotas mid-generation.

DELIVERABLE
- A list of the specific issue(s) found, with file names and line numbers.
- For each issue, explain WHY it causes mid-response cutoffs.
- Propose a fix for each, and implement the fixes if I confirm.
- If nothing conclusive is found in code, suggest what additional logging 
  to add to pinpoint the exact failure point.

Please investigate methodically — check each area above rather than 
guessing at just one cause.