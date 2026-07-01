import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import {
  listConversations, getConversation,
  createConversation, updateConversation, deleteConversation,
} from "@/modules/conversations/conversations.controller";

export const conversationsRouter = Router();

conversationsRouter.use(authenticate);
conversationsRouter.get("/", listConversations);
conversationsRouter.post("/", createConversation);
conversationsRouter.get("/:id", getConversation);
conversationsRouter.put("/:id", updateConversation);
conversationsRouter.delete("/:id", deleteConversation);
