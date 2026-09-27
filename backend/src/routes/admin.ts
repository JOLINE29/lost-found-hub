import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate, requireAdmin);

// GET /admin/stats
router.get("/stats", async (_req, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [
    totalReports, pendingClaims, potentialMatches,
    unclaimedOver30, recoveredItems, lostCount, foundCount,
  ] = await Promise.all([
    prisma.item.count(),
    prisma.claim.count({ where: { status: "PENDING" } }),
    prisma.match.count({ where: { status: "PENDING" } }),
    prisma.item.count({ where: { type: "FOUND", status: "ACTIVE", createdAt: { lte: thirtyDaysAgo } } }),
    prisma.item.count({ where: { status: "RECOVERED" } }),
    prisma.item.count({ where: { type: "LOST" } }),
    prisma.item.count({ where: { type: "FOUND" } }),
  ]);
  res.json({ totalReports, pendingClaims, potentialMatches, unclaimedOver30, recoveredItems, lostCount, foundCount });
});

// GET /admin/items
router.get("/items", async (req, res: Response) => {
  const { status, type } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;
  const items = await prisma.item.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { reporter: { select: { id: true, name: true, email: true } }, claims: true },
  });
  res.json(items);
});

// GET /admin/matches
router.get("/matches", async (_req, res: Response) => {
  const matches = await prisma.match.findMany({
    where: { status: "PENDING" },
    orderBy: { score: "desc" },
    include: {
      lostItem: { include: { reporter: { select: { name: true } } } },
      foundItem: { include: { reporter: { select: { name: true } } } },
    },
  });
  res.json(matches);
});

// PATCH /admin/matches/:id
router.patch("/matches/:id", async (req, res: Response) => {
  const match = await prisma.match.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });
  res.json(match);
});

// GET /admin/unclaimed - items found > 30 days ago still active
router.get("/unclaimed", async (_req, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const items = await prisma.item.findMany({
    where: { type: "FOUND", status: "ACTIVE", createdAt: { lte: thirtyDaysAgo } },
    orderBy: { createdAt: "asc" },
    include: { reporter: { select: { name: true, email: true } } },
  });
  res.json(items);
});

// POST /admin/unclaimed/:id/alert - send community-wide alert
router.post("/unclaimed/:id/alert", async (req, res: Response) => {
  const item = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!item) { res.status(404).json({ message: "Item not found" }); return; }

  const users = await prisma.user.findMany({ select: { id: true } });
  await prisma.notification.createMany({
    data: users.map(u => ({
      userId: u.id,
      title: "📢 Community Alert: Unclaimed Item",
      message: `A ${item.title} found near ${item.location} has been unclaimed for over 30 days. Do you recognize it?`,
      link: `/items/${item.id}`,
    })),
  });

  res.json({ message: "Community alert sent", recipients: users.length });
});

// GET /admin/claims
router.get("/claims", async (_req, res: Response) => {
  const claims = await prisma.claim.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      item: true,
      claimant: { select: { id: true, name: true, email: true } },
      room: { include: { messages: { include: { sender: { select: { name: true } } } } } },
    },
  });
  res.json(claims);
});

export default router;
