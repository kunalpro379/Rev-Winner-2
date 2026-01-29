import express from "express";
import { z } from "zod";
import { recordingsStorage } from "./storage-recordings";
import { authenticateToken } from "./middleware/auth";
import { insertCallRecordingSchema, insertCallMeetingMinutesSchema } from "../shared/schema";

const router = express.Router();

// ========================================
// CALL RECORDING PREFERENCES
// ========================================

// Toggle call recording feature
router.post("/api/call-recording/toggle", authenticateToken, async (req, res) => {
  try {
    const { enabled } = z.object({ 
      enabled: z.boolean() 
    }).parse(req.body);
    
    await recordingsStorage.toggleCallRecording(req.jwtUser!.userId, enabled);
    
    res.json({
      success: true,
      enabled,
      message: enabled 
        ? "Call recording enabled. Your calls will be saved for 7 days."
        : "Call recording disabled. New calls will not be recorded."
    });
  } catch (error: any) {
    console.error("Toggle call recording error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to toggle call recording" 
    });
  }
});

// Get call recording preference status
router.get("/api/call-recording/status", authenticateToken, async (req, res) => {
  try {
    const enabled = await recordingsStorage.isCallRecordingEnabled(req.jwtUser!.userId);
    res.json({ enabled });
  } catch (error: any) {
    console.error("Get call recording status error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to get call recording status" 
    });
  }
});

// ========================================
// CALL RECORDINGS MANAGEMENT
// ========================================

// Create/upload call recording
router.post("/api/call-recordings", authenticateToken, async (req, res) => {
  try {
    // Check if recording is enabled for this user
    const enabled = await recordingsStorage.isCallRecordingEnabled(req.jwtUser!.userId);
    if (!enabled) {
      return res.status(403).json({ 
        message: "Call recording is disabled. Enable it in your profile settings." 
      });
    }
    
    const recordingData = insertCallRecordingSchema.parse({
      ...req.body,
      userId: req.jwtUser!.userId,
    });
    
    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const recording = await recordingsStorage.createCallRecording({
      ...recordingData,
      expiresAt,
    });
    
    res.status(201).json({
      success: true,
      recording,
      message: "Call recording saved successfully. Expires in 7 days."
    });
  } catch (error: any) {
    console.error("Create call recording error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to save call recording" 
    });
  }
});

// Get user's active call recordings
router.get("/api/call-recordings", authenticateToken, async (req, res) => {
  try {
    const recordings = await recordingsStorage.getActiveCallRecordings(req.jwtUser!.userId);
    res.json({ recordings });
  } catch (error: any) {
    console.error("Get call recordings error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to fetch call recordings" 
    });
  }
});

// Get specific call recording
router.get("/api/call-recordings/:id", authenticateToken, async (req, res) => {
  try {
    const recording = await recordingsStorage.getCallRecording(req.params.id);
    
    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }
    
    // Verify ownership
    if (recording.userId !== req.jwtUser!.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json({ recording });
  } catch (error: any) {
    console.error("Get call recording error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to fetch call recording" 
    });
  }
});

// Delete call recording
router.delete("/api/call-recordings/:id", authenticateToken, async (req, res) => {
  try {
    const recording = await recordingsStorage.getCallRecording(req.params.id);
    
    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }
    
    // Verify ownership
    if (recording.userId !== req.jwtUser!.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    await recordingsStorage.deleteCallRecording(req.params.id);
    
    res.json({
      success: true,
      message: "Call recording deleted successfully"
    });
  } catch (error: any) {
    console.error("Delete call recording error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to delete call recording" 
    });
  }
});

// ========================================
// MEETING MINUTES MANAGEMENT
// ========================================

// Create meeting minutes
router.post("/api/meeting-minutes", authenticateToken, async (req, res) => {
  try {
    // Check if recording is enabled for this user
    const enabled = await recordingsStorage.isCallRecordingEnabled(req.jwtUser!.userId);
    if (!enabled) {
      return res.status(403).json({ 
        message: "Call recording is disabled. Enable it in your profile settings." 
      });
    }
    
    const minutesData = insertCallMeetingMinutesSchema.parse({
      ...req.body,
      userId: req.jwtUser!.userId,
    });
    
    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const minutes = await recordingsStorage.createMeetingMinutes({
      ...minutesData,
      expiresAt,
    });
    
    res.status(201).json({
      success: true,
      minutes,
      message: "Meeting minutes saved successfully. Expires in 7 days."
    });
  } catch (error: any) {
    console.error("Create meeting minutes error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to save meeting minutes" 
    });
  }
});

// Get user's active meeting minutes
router.get("/api/meeting-minutes", authenticateToken, async (req, res) => {
  try {
    const minutes = await recordingsStorage.getActiveMeetingMinutes(req.jwtUser!.userId);
    res.json({ minutes });
  } catch (error: any) {
    console.error("Get meeting minutes error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to fetch meeting minutes" 
    });
  }
});

// Get specific meeting minutes
router.get("/api/meeting-minutes/:id", authenticateToken, async (req, res) => {
  try {
    const minutes = await recordingsStorage.getMeetingMinutes(req.params.id);
    
    if (!minutes) {
      return res.status(404).json({ message: "Meeting minutes not found" });
    }
    
    // Verify ownership
    if (minutes.userId !== req.jwtUser!.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json({ minutes });
  } catch (error: any) {
    console.error("Get meeting minutes error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to fetch meeting minutes" 
    });
  }
});

// Update meeting minutes
router.patch("/api/meeting-minutes/:id", authenticateToken, async (req, res) => {
  try {
    const minutes = await recordingsStorage.getMeetingMinutes(req.params.id);
    
    if (!minutes) {
      return res.status(404).json({ message: "Meeting minutes not found" });
    }
    
    // Verify ownership
    if (minutes.userId !== req.jwtUser!.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updatedMinutes = await recordingsStorage.updateMeetingMinutes(
      req.params.id,
      req.body
    );
    
    res.json({
      success: true,
      minutes: updatedMinutes,
      message: "Meeting minutes updated successfully"
    });
  } catch (error: any) {
    console.error("Update meeting minutes error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to update meeting minutes" 
    });
  }
});

// Delete meeting minutes
router.delete("/api/meeting-minutes/:id", authenticateToken, async (req, res) => {
  try {
    const minutes = await recordingsStorage.getMeetingMinutes(req.params.id);
    
    if (!minutes) {
      return res.status(404).json({ message: "Meeting minutes not found" });
    }
    
    // Verify ownership
    if (minutes.userId !== req.jwtUser!.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    await recordingsStorage.deleteMeetingMinutes(req.params.id);
    
    res.json({
      success: true,
      message: "Meeting minutes deleted successfully"
    });
  } catch (error: any) {
    console.error("Delete meeting minutes error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to delete meeting minutes" 
    });
  }
});

export default router;
