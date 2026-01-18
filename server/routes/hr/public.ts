import { Router, Request, Response } from "express";
import { db } from "../../db.js";
import { contracts, contractTokens, equipment, equipmentSignatureTokens } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

// Public contract lookup
router.get("/contracts/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const [tokenRecord] = await db.select().from(contractTokens).where(eq(contractTokens.token, token));
    if (!tokenRecord) {
      return res.status(404).json({ error: "Invalid or expired contract link" });
    }

    const [contract] = await db.select().from(contracts).where(eq(contracts.id, tokenRecord.contractId));
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    res.json({
      id: contract.id,
      title: contract.title,
      content: contract.content,
      status: contract.status,
    });
  } catch (error) {
    console.error("Public contract fetch error:", error);
    res.status(500).json({ error: "Contract lookup failed" });
  }
});

router.post("/contracts/:token/sign", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { signature, signerName } = req.body;

    const [tokenRecord] = await db.select().from(contractTokens).where(eq(contractTokens.token, token));
    if (!tokenRecord) {
      return res.status(404).json({ error: "Invalid or expired contract link" });
    }

    const [updated] = await db.update(contracts)
      .set({
        status: "SIGNED",
        signedDate: new Date(),
        signature: signature || signerName || "Signed",
      })
      .where(eq(contracts.id, tokenRecord.contractId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Contract not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Public contract sign error:", error);
    res.status(500).json({ error: "Contract signing failed" });
  }
});

// Public equipment signature lookup
router.get("/equipment/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const [tokenRecord] = await db.select()
      .from(equipmentSignatureTokens)
      .where(eq(equipmentSignatureTokens.token, token));

    if (!tokenRecord) {
      return res.status(404).json({ error: "Invalid equipment link" });
    }

    const equipmentItem = tokenRecord.equipmentId
      ? await db.select().from(equipment).where(eq(equipment.id, tokenRecord.equipmentId))
      : [];

    res.json({
      token: tokenRecord.token,
      type: tokenRecord.type,
      status: tokenRecord.status,
      equipment: equipmentItem[0] || null,
    });
  } catch (error) {
    console.error("Public equipment fetch error:", error);
    res.status(500).json({ error: "Equipment lookup failed" });
  }
});

router.post("/equipment/:token/sign", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { signature, signerName, signerEmail, notes } = req.body;

    const [tokenRecord] = await db.select()
      .from(equipmentSignatureTokens)
      .where(eq(equipmentSignatureTokens.token, token));

    if (!tokenRecord) {
      return res.status(404).json({ error: "Invalid equipment link" });
    }

    await db.update(equipmentSignatureTokens)
      .set({
        signerName,
        signerEmail,
        signature: signature || signerName || "Signed",
        notes,
        status: "signed",
        signedAt: new Date(),
      })
      .where(eq(equipmentSignatureTokens.id, tokenRecord.id));

    res.json({ success: true });
  } catch (error) {
    console.error("Public equipment sign error:", error);
    res.status(500).json({ error: "Equipment signing failed" });
  }
});

export default router;
