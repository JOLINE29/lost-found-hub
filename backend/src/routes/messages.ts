import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /messages - send message in room
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { roomId, content } = req.body;
  if (!roomId || !content) { res.status(400).json({ message: "roomId and content required" }); return; }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { claim: { include: { item: { include: { reporter: true } }, claimant: true } } },
  });
  if (!room) { res.status(404).json({ message: "Room not found" }); return; }

  const userId = req.user!.id;
  const isParticipant =
    room.claim.claimantId === userId ||
    room.claim.item.reporterId === userId ||
    req.user?.role === "ADMIN";
  if (!isParticipant) { res.status(403).json({ message: "Forbidden" }); return; }

  const message = await prisma.message.create({
    data: { roomId, senderId: userId, content },
    include: { sender: { select: { id: true, name: true } } },
  });

  res.status(201).json(message);
});

export default router;
