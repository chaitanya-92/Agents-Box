import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { listApiKeys, createApiKey, deleteApiKey } from "@/modules/apikeys/apikeys.controller";

export const apiKeyRouter = Router();

apiKeyRouter.use(authenticate);
apiKeyRouter.get("/", listApiKeys);
apiKeyRouter.post("/", createApiKey);
apiKeyRouter.delete("/:id", deleteApiKey);
