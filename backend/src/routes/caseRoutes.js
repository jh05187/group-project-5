import express from "express";
import mongoose from "mongoose";
import { CaseModel } from "../models/Case.js";
import { Vote } from "../models/Vote.js";
import { Comment } from "../models/Comment.js";
import { attachOptionalAuth, requireAuth } from "../middleware/auth.js";
import { accuracyRate, computeBadges, levelFromScore, pointsForAnswer } from "../utils/scoring.js";

const router = express.Router();

router.get("/", attachOptionalAuth, async (req, res) => {
  const { difficulty, contentType, unattempted } = req.query;
  const filter = { isPublished: true };
  if (difficulty) filter.difficulty = difficulty;
  if (contentType) filter.contentType = contentType;

  let attemptedMap = new Map();
  if (req.user?._id) {
    const votes = await Vote.find({ userId: req.user._id }).select("caseId createdAt isCorrect answer");
    attemptedMap = new Map(
      votes.map((vote) => [
        vote.caseId.toString(),
        {
          attemptedAt: vote.createdAt,
          isCorrect: vote.isCorrect,
          answer: vote.answer,
        },
      ]),
    );
  }

  if (unattempted === "true" && attemptedMap.size) {
    filter._id = { $nin: [...attemptedMap.keys()] };
  }

  const cases = await CaseModel.find(filter)
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();
  return res.json({
    cases: cases.map((caseItem) => {
      const attempt = attemptedMap.get(caseItem._id.toString());
      return {
        ...caseItem,
        attempted: Boolean(attempt),
        attemptSummary: attempt || null,
      };
    }),
  });
});

router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid case id" });
  }

  const caseItem = await CaseModel.findOne({ _id: req.params.id, isPublished: true }).lean();
  if (!caseItem) return res.status(404).json({ error: "Case not found" });
  return res.json({ case: caseItem });
});

router.post("/:id/votes", requireAuth, async (req, res) => {
  const { answer } = req.body;
  if (!["scam", "safe", "unsure"].includes(answer)) {
    return res.status(400).json({ error: "answer must be scam, safe, or unsure" });
  }

  const caseItem = await CaseModel.findById(req.params.id);
  if (!caseItem || !caseItem.isPublished) {
    return res.status(404).json({ error: "Case not found" });
  }

  const isCorrect = answer !== "unsure" && answer === caseItem.correctAnswer;
  const pointsAwarded = pointsForAnswer(answer, isCorrect);

  const existingVote = await Vote.findOne({ userId: req.user._id, caseId: caseItem._id });
  if (existingVote) {
    return res.status(409).json({ error: "You already voted on this case" });
  }

  await Vote.create({
    userId: req.user._id,
    caseId: caseItem._id,
    answer,
    isCorrect,
    pointsAwarded,
  });

  caseItem.totalVotes += 1;
  if (isCorrect) caseItem.correctVotes += 1;
  await caseItem.save();

  req.user.totalVotes += 1;
  if (isCorrect) req.user.correctVotes += 1;
  req.user.reputationScore += pointsAwarded;
  req.user.level = levelFromScore(req.user.reputationScore);
  req.user.accuracyRate = accuracyRate(req.user.correctVotes, req.user.totalVotes);
  if (!req.user.completedCases.some((id) => id.toString() === caseItem._id.toString())) {
    req.user.completedCases.push(caseItem._id);
  }
  req.user.badges = computeBadges(req.user);
  await req.user.save();

  return res.status(201).json({
    result: {
      answer,
      isCorrect,
      pointsAwarded,
      correctAnswer: caseItem.correctAnswer,
      explanation: caseItem.explanation,
    },
    profile: {
      reputationScore: req.user.reputationScore,
      level: req.user.level,
      accuracyRate: req.user.accuracyRate,
      totalVotes: req.user.totalVotes,
      badges: req.user.badges,
    },
  });
});

router.get("/:id/comments", async (req, res) => {
  const comments = await Comment.find({ caseId: req.params.id })
    .populate("userId", "username")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return res.json({
    comments: comments.map((c) => ({
      id: c._id,
      body: c.body,
      createdAt: c.createdAt,
      user: c.userId
        ? {
            id: c.userId._id,
            username: c.userId.username,
          }
        : null,
    })),
  });
});

router.post("/:id/comments", requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body || !String(body).trim()) {
    return res.status(400).json({ error: "Comment body is required" });
  }

  const caseItem = await CaseModel.findById(req.params.id);
  if (!caseItem || !caseItem.isPublished) {
    return res.status(404).json({ error: "Case not found" });
  }

  const comment = await Comment.create({
    userId: req.user._id,
    caseId: caseItem._id,
    body: String(body).trim(),
  });

  return res.status(201).json({
    comment: {
      id: comment._id,
      body: comment.body,
      createdAt: comment.createdAt,
      user: {
        id: req.user._id,
        username: req.user.username,
      },
    },
  });
});

export default router;
