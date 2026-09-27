import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { computeMatchScore } from "../lib/matcher";
import { ItemType, ItemStatus } from "@prisma/client";
import { upload } from "../lib/cloudinary";

const router = Router();

// GET /items - community feed with search & filter
router.get("/", async (req, res) => {
  const { search, type, category, location, status, page = "1", limit = "12" } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (category) where.category = { contains: category, mode: "insensitive" };
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (status) where.status = status;
  else where.status = { in: ["ACTIVE", "MATCHED", "CLAIMED"] };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { id: true, name: true } } },
    }),
    prisma.item.count({ where }),
  ]);

  res.json({ items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// GET /items/recovered
router.get("/recovered", async (_, res) => {
  const items = await prisma.item.findMany({
    where: { status: "RECOVERED" },
    orderBy: { updatedAt: "desc" },
    include: { reporter: { select: { name: true } } },
  });
  res.json(items);
});

// GET /items/my - reporter feed
router.get("/my", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const [myItems, myClaims] = await Promise.all([
    prisma.item.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        claims: { include: { claimant: { select: { name: true } } } },
        lostMatches: { include: { foundItem: true } },
        foundMatches: { include: { lostItem: true } },
      },
    }),
    prisma.claim.findMany({
      where: { claimantId: userId },
      orderBy: { createdAt: "desc" },
      include: { item: true },
    }),
  ]);
  res.json({ myItems, myClaims });
});

// GET /items/:id
router.get("/:id", async (req, res) => {
  const item = await prisma.item.findUnique({
    where: { id: req.params.id },
    include: {
      reporter: { select: { id: true, name: true } },
      lostMatches: { include: { foundItem: { include: { reporter: { select: { name: true } } } } } },
      foundMatches: { include: { lostItem: { include: { reporter: { select: { name: true } } } } } },
    },
  });
  if (!item) { res.status(404).json({ message: "Item not found" }); return; }
  res.json(item);
});

// POST /items - report lost or found
router.post("/", authenticate, upload.single("image"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, category, description, location, dateLostFound, type } = req.body;
  if (!title || !category || !description || !location || !dateLostFound || !type) {
    res.status(400).json({ message: "All fields required" }); return;
  }

  const imageUrl = req.file ? (req.file as Express.Multer.File & { path: string }).path : undefined;
  const item = await prisma.item.create({
    data: {
      reporterId: req.user!.id,
      type: type as ItemType,
      title,
      category,
      description,
      imageUrl,
      location,
      dateLostFound: new Date(dateLostFound),
    },
  });

  // Run smart matching
  const oppositeType = type === "LOST" ? "FOUND" : "LOST";
  const candidates = await prisma.item.findMany({
    where: { type: oppositeType as ItemType, status: "ACTIVE" },
  });

  const MATCH_THRESHOLD = 0.4;
  for (const candidate of candidates) {
    const lostItem = type === "LOST" ? item : candidate;
    const foundItem = type === "FOUND" ? item : candidate;
    const score = computeMatchScore(lostItem, foundItem);
    if (score >= MATCH_THRESHOLD) {
      const match = await prisma.match.create({
        data: { lostItemId: lostItem.id, foundItemId: foundItem.id, score },
      });

      // Update statuses
      await prisma.item.updateMany({
        where: { id: { in: [lostItem.id, foundItem.id] } },
        data: { status: "MATCHED" },
      });

      // Notify lost item reporter
      await prisma.notification.create({
        data: {
          userId: lostItem.reporterId,
          title: "Potential Match Found!",
          message: `A ${foundItem.title} matching your lost item was found near ${foundItem.location}.`,
          link: `/items/${foundItem.id}`,
        },
      });

      void match;
    }
  }

  res.status(201).json(item);
});

// PATCH /items/:id/status - admin
router.patch("/:id/status", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }
  const item = await prisma.item.update({
    where: { id: String(req.params.id) },
    data: { status: req.body.status as ItemStatus },
  });
  res.json(item);
});

export default router;
