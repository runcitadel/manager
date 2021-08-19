import { Router, Request, Response } from "express";
import pjson from "../package.json";
const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({ version: "manager-" + pjson.version });
});

export default router;
