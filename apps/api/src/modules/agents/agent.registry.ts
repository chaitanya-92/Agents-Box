import { agentCatalog } from "@agentverse/config";

export const agentRegistry = new Map(agentCatalog.map((agent) => [agent.id, agent]));

export function getAgentById(agentId: string) {
  return agentRegistry.get(agentId);
}

