import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /claims - submit a claim
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { itemId, message } = req.body;
  if (!itemId || !message) { res.status(400).json({ message: "itemId and message required" }); return; }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) { res.status(404).json({ message: "Item not found" }); return; }
  if (item.reporterId === req.user!.id) { res.status(400).json({ message: "Cannot claim your own item" }); return; }

  const existing = await prisma.claim.findFirst({ where: { itemId, claimantId: req.user!.id } });
  if (existing) { res.status(409).json({ message: "You already submitted a claim for this item" }); return; }

  const claim = await prisma.claim.create({
    data: { itemId, claimantId: req.user!.id, message },
    include: { item: true, claimant: { select: { name: true } } },
  });

  // Create private verification room
  await prisma.room.create({ data: { claimId: claim.id } });

  // Notify item reporter
  await prisma.notification.create({
    data: {
      userId: item.reporterId,
      title: "New Claim Submitted",
      message: `${claim.claimant.name} submitted a claim for your item: ${item.title}.`,
      link: `/claims/${claim.id}`,
    },
  });

  await prisma.item.update({ where: { id: itemId }, data: { status: "CLAIMED" } });

  res.status(201).json(claim);
});

// GET /claims/:id
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const claim = await prisma.claim.findUnique({
    where: { id: String(req.params.id) },
    include: {
      item: { include: { reporter: { select: { id: true, name: true } } } },
      claimant: { select: { id: true, name: true } },
      room: { include: { messages: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } } } },
    },
  });
  if (!claim) { res.status(404).json({ message: "Claim not found" }); return; }

  const userId = req.user!.id;
  const isParticipant = claim.claimantId === userId || claim.item.reporter.id === userId || req.user?.role === "ADMIN";
  if (!isParticipant) { res.status(403).json({ message: "Forbidden" }); return; }

  res.json(claim);
});

// PATCH /claims/:id - admin approve/reject
router.patch("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "ADMIN") { res.status(403).json({ message: "Admin only" }); return; }
  const { status } = req.body;
  const claimId = String(req.params.id);

  // Fetch claim with includes separately to avoid Prisma type inference issues
  const claimBase = await prisma.claim.update({
    where: { id: claimId },
    data: { status },
  });
  const claimItem = await prisma.item.findUnique({ where: { id: claimBase.itemId } });

  if (status === "APPROVED") {
    await prisma.item.update({ where: { id: claimBase.itemId }, data: { status: "RECOVERED" } });
    await prisma.notification.create({
      data: {
        userId: claimBase.claimantId,
        title: "Claim Approved!",
        message: `Your claim for "${claimItem?.title}" has been approved. The item is yours!`,
        link: `/items/${claimBase.itemId}`,
      },
    });
  } else if (status === "REJECTED") {
    await prisma.item.update({ where: { id: claimBase.itemId }, data: { status: "ACTIVE" } });
    await prisma.notification.create({
      data: {
        userId: claimBase.claimantId,
        title: "Claim Rejected",
        message: `Your claim for "${claimItem?.title}" was rejected.`,
      },
    });
  }
  const claim = claimBase;

  res.json(claim);
});

// GET /claims - admin: all claims
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "ADMIN") { res.status(403).json({ message: "Admin only" }); return; }
  const claims = await prisma.claim.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      item: true,
      claimant: { select: { id: true, name: true, email: true } },
    },
  });
  res.json(claims);
});

export default router;
