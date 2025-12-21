
import { GoogleGenAI } from "@google/genai";
import { Team, Agent, Topology, TopologyGroup, TopologyNode, ChatMessage } from "../types";

// Helper to simulate typing delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getMockContent = (specialty?: string): string[] => {
  const defaults = ["Initializing protocol handshake...", "Scanning local context buffers...", "Heuristic analysis complete."];
  const contentMap: Record<string, string[]> = {
    'Query Optimization': ["Analyzing query plans...", "Detected full table scan on 'orders'.", "Index scan density is optimal."],
    'Error Tracking': ["Parsing error logs...", "Grouping stack traces.", "Found 3 ConnectionTimeoutException."],
    'Load Analysis': ["Sampling throughput...", "Latency p99 distribution indicates spikes.", "Concurrent pool usage at 45%."]
  };
  return contentMap[specialty] || defaults;
};

export const generateGlobalPlan = async (userRequest: string, topology: Topology, teams: Team[]) => {
  await delay(1500);
  const req = userRequest.toLowerCase();
  const selectedTeams = teams.filter(t => 
    req.includes(t.name.toLowerCase().split(' ')[0]) || 
    (t.name.includes('DB') && (req.includes('database') || req.includes('consistency')))
  );
  if (selectedTeams.length === 0) selectedTeams.push(teams[0]);
  return selectedTeams.map(t => ({ teamId: t.id, instruction: `Analyze: "${userRequest}" for ${t.name}.` }));
};

export const generateTeamDelegation = async (team: Team, instruction: string) => {
  await delay(1000);
  return team.members.map(member => ({ agentId: member.id, task: `Execute ${member.specialty}. Context: ${instruction}` }));
};

export async function* streamWorkerTask(agent: Agent, task: string, context: string): AsyncGenerator<string> {
  const steps = getMockContent(agent.specialty);
  yield `[Task Initiated] Agent: ${agent.name}\nContext: ${context.substring(0, 50)}...\n\n`;
  for (const step of steps) {
    for (const word of step.split(" ")) { yield word + " "; await delay(30 + Math.random() * 40); }
    yield "\n"; await delay(300);
  }
  const r = Math.random();
  yield `\nSUMMARY: {"warnings": ${r < 0.3 ? 1 : 0}, "critical": ${r < 0.1 ? 1 : 0}}`;
}

export async function* streamTeamReport(team: Team, instruction: string, workerResults: any[]): AsyncGenerator<string> {
  const lines = [`Reporting for ${team.name}.`, `Directive executed.`, `Aggregated Status: Nominal.`];
  for (const line of lines) {
    for (const word of line.split(" ")) { yield word + " "; await delay(20); }
    yield "\n"; await delay(100);
  }
}

// --- Real Gemini Chat Integration ---

export async function* streamChatResponse(
  prompt: string,
  history: ChatMessage[],
  context: {
    nodes: TopologyNode[];
    groups: TopologyGroup[];
    allTeams: Team[];
  }
): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format history for Gemini
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // Construct context-rich system instruction
  const systemInstruction = `You are the EntropyOps Senior AI Orchestrator. 
You are an interface to a Hierarchical Multi-Agent System that manages distributed infrastructure.
CURRENT SYSTEM STATE:
- Total Resources: ${context.nodes.length}
- Total Topology Groups: ${context.groups.length}
- Total Agent Teams: ${context.allTeams.length}

Use the technical metadata provided in the user's attachments to give precise advice. 
If asked to "run" something, explain that they should use the Command Center for formal agent execution.
Be concise, professional, and use Markdown for technical details.`;

  // Add the current prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents,
      config: { systemInstruction }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) yield chunk.text;
    }
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    yield "I encountered an error connecting to the neural core. Please check your system configuration.";
  }
}
