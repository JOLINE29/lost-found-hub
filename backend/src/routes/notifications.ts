import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json(notifications);
});

router.patch("/:id/read", authenticate, async (req: AuthRequest, res: Response) => {
  const notif = await prisma.notification.updateMany({
    where: { id: String(req.params.id), userId: req.user!.id },
    data: { status: "READ" },
  });
  res.json(notif);
});

router.patch("/read-all", authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, status: "UNREAD" },
    data: { status: "READ" },
  });
  res.json({ message: "All marked as read" });
});

export default router;
