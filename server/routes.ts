import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { setupAuth } from "./auth";
import { fileStorageService } from "./file-storage";
import { emailService } from "./email";
import { insertTenantSchema, insertQuestionSchema, insertResponseSchema, insertDomainSchema, insertTenantQuestionSchema } from "@shared/schema";
import { z } from "zod";

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimetypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg"
    ];

    if (allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// Utility function to check user role
function checkRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden - Insufficient permissions" });
    }
  };
}

// Utility function to validate request body with Zod
function validateBody(schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        next(error);
      }
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Tenant Management Routes (Admin only)
  app.get("/api/admin/tenants", async (req, res, next) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/tenants", validateBody(insertTenantSchema), async (req, res, next) => {
    try {
      const tenant = await storage.createTenant(req.body);
      res.status(201).json(tenant);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/tenants/:id", async (req, res, next) => {
    try {
      const tenant = await storage.getTenant(parseInt(req.params.id));
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/tenants/:id", validateBody(insertTenantSchema), async (req, res, next) => {
    try {
      const tenant = await storage.updateTenant(parseInt(req.params.id), req.body);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/tenants/:id", async (req, res, next) => {
    try {
      const result = await storage.deleteTenant(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Domain Management Routes (Admin only)
  app.get("/api/domains", async (req, res, next) => {
    try {
      const domains = await storage.getAllDomains();
      res.json(domains);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/domains", validateBody(insertDomainSchema), async (req, res, next) => {
    try {
      const domain = await storage.createDomain(req.body);
      res.status(201).json(domain);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/domains/:id", validateBody(insertDomainSchema), async (req, res, next) => {
    try {
      const domain = await storage.updateDomain(parseInt(req.params.id), req.body);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      res.json(domain);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/domains/:id", async (req, res, next) => {
    try {
      const result = await storage.deleteDomain(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Domain not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Question Management Routes (Admin only)
  app.get("/api/questions", async (req, res, next) => {
    try {
      const domainId = req.query.domainId ? parseInt(req.query.domainId as string) : undefined;

      let questions;
      if (domainId) {
        questions = await storage.getQuestionsByDomain(domainId);
      } else {
        questions = await storage.getAllQuestions();
      }

      res.json(questions);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/questions", validateBody(insertQuestionSchema), async (req, res, next) => {
    try {
      const question = await storage.createQuestion(req.body);
      res.status(201).json(question);
    } catch (error) {
      next(error);
    }
  });

  // Bulk import questions from Excel
  app.post("/api/admin/questions/bulk", async (req, res, next) => {
    try {
      if (!Array.isArray(req.body.questions)) {
        return res.status(400).json({ message: "Invalid request format. Expected an array of questions." });
      }

      const questions = req.body.questions;
      const results = [];

      for (const questionData of questions) {
        try {
          // Validate essential fields
          if (!questionData.title) {
            throw new Error("Question title is required");
          }

          if (!questionData.domainId) {
            throw new Error("Domain ID is required");
          }

          // Set default values for optional fields
          const validQuestion = {
            title: questionData.title,
            description: questionData.description || null,
            domainId: questionData.domainId,
            required: questionData.required !== undefined ? questionData.required : false,
            tags: questionData.tags || []
          };

          // Create the question
          const question = await storage.createQuestion(validQuestion);
          results.push({ success: true, question });
        } catch (error: any) {
          console.error("Error creating question:", error);
          results.push({ success: false, error: error.message, data: questionData });
        }
      }

      // Return summary of results
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;

      res.status(201).json({
        message: `Imported ${successCount} questions successfully, ${errorCount} failed.`,
        totalProcessed: results.length,
        successCount,
        errorCount,
        results
      });
    } catch (error: any) {
      console.error("Bulk import error:", error);
      res.status(500).json({ message: error.message || "Error processing bulk import" });
    }
  });

  app.get("/api/questions/:id", async (req, res, next) => {
    try {
      const question = await storage.getQuestion(parseInt(req.params.id));
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/questions/:id", validateBody(insertQuestionSchema), async (req, res, next) => {
    try {
      const question = await storage.updateQuestion(parseInt(req.params.id), req.body);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/questions/:id", async (req, res, next) => {
    try {
      const result = await storage.deleteQuestion(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Tenant Question Routes
  app.get("/api/tenant/:tenantId/questions", async (req, res, next) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const questions = await storage.getTenantQuestionsWithDetails(tenantId);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/tenant-questions", validateBody(insertTenantQuestionSchema), async (req, res, next) => {
    try {
      // Check if this question is already assigned to the tenant
      const existing = await storage.getTenantQuestionByIds(
        req.body.tenantId,
        req.body.questionId
      );

      if (existing) {
        return res.status(400).json({ 
          message: "This question is already assigned to the tenant" 
        });
      }

      const tenantQuestion = await storage.createTenantQuestion(req.body);
      res.status(201).json(tenantQuestion);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/tenant/:tenantId/questions/:id/status", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!["Unanswered", "In Progress", "Answered"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const tenantQuestion = await storage.updateTenantQuestion(id, { status });

      if (!tenantQuestion) {
        return res.status(404).json({ message: "Tenant question not found" });
      }

      res.json(tenantQuestion);
    } catch (error) {
      next(error);
    }
  });

  // Response Routes
  app.get("/api/tenant-questions/:id/responses", async (req, res, next) => {
    try {
      const tenantQuestionId = parseInt(req.params.id);
      const tenantQuestion = await storage.getTenantQuestion(tenantQuestionId);

      if (!tenantQuestion) {
        return res.status(404).json({ message: "Tenant question not found" });
      }

      // Ensure user has access to this tenant's data
      const user = req.user!;
      if (user.role !== "Admin" && user.tenantId !== tenantQuestion.tenantId) {
        return res.status(403).json({ 
          message: "You don't have permission to access this data" 
        });
      }

      const responses = await storage.getResponsesByTenantQuestion(tenantQuestionId);

      // Get user details and attachments for each response
      const responsesWithDetails = await Promise.all(
        responses.map(async (response) => {
          const user = await storage.getUser(response.userId);
          const attachments = await storage.getAttachmentsByResponse(response.id);

          return {
            ...response,
            user: user ? { 
              id: user.id, 
              fullName: user.fullName, 
              role: user.role 
            } : null,
            attachments
          };
        })
      );

      res.json(responsesWithDetails);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tenant-questions/:id/responses", validateBody(insertResponseSchema), async (req, res, next) => {
    try {
      const tenantQuestionId = parseInt(req.params.id);
      const tenantQuestion = await storage.getTenantQuestion(tenantQuestionId);

      if (!tenantQuestion) {
        return res.status(404).json({ message: "Tenant question not found" });
      }

      // Ensure user has access to this tenant's data
      const currentUser = req.user!;
      if (currentUser.role !== "Admin" && currentUser.role !== "Consultant" && currentUser.tenantId !== tenantQuestion.tenantId) {
        return res.status(403).json({ 
          message: "You don't have permission to add responses to this question" 
        });
      }

      const response = await storage.createResponse({
        tenantQuestionId,
        userId: currentUser.id,
        content: req.body.content
      });

      // Get the question details for notification
      const question = await storage.getQuestion((await storage.getTenantQuestion(tenantQuestionId))!.questionId);

      // Notify users about the new response
      const tenantUsers = await storage.getUsersByTenant(tenantQuestion.tenantId);
      for (const user of tenantUsers) {
        if (user.id !== currentUser.id) { // Don't notify the user who posted the response
          await emailService.sendResponseAddedNotification(
            user, 
            question!.title, 
            tenantQuestionId
          );
        }
      }

      const responseUser = await storage.getUser(response.userId);
      res.status(201).json({
        ...response,
        user: responseUser ? { 
          id: responseUser.id, 
          fullName: responseUser.fullName, 
          role: responseUser.role 
        } : null,
        attachments: []
      });
    } catch (error) {
      next(error);
    }
  });

  // File Upload Routes
  app.post("/api/responses/:id/attachments", upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const responseId = parseInt(req.params.id);
      const response = await storage.getResponse(responseId);

      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }

      // Ensure user has permission (either owns the response or is admin)
      const user = req.user!;
      if (user.id !== response.userId && user.role !== "Admin") {
        return res.status(403).json({ 
          message: "You don't have permission to add attachments to this response" 
        });
      }

      // Save the file
      const savedFile = await fileStorageService.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Create attachment record
      const attachment = await storage.createAttachment({
        responseId,
        filename: savedFile.filename,
        originalName: savedFile.originalName,
        mimeType: savedFile.mimeType,
        size: savedFile.size
      });

      // Get question details for notification
      const tenantQuestion = await storage.getTenantQuestion(response.tenantQuestionId);
      const question = await storage.getQuestion(tenantQuestion!.questionId);

      // Notify users about the file upload
      const tenantUsers = await storage.getUsersByTenant(tenantQuestion!.tenantId);
      for (const notifyUser of tenantUsers) {
        if (notifyUser.id !== user.id) { // Don't notify the uploader
          await emailService.sendFileUploadedNotification(
            notifyUser,
            question!.title,
            tenantQuestion!.id,
            savedFile.originalName
          );
        }
      }

      res.status(201).json(attachment);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/attachments/:id", async (req, res, next) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await storage.getAttachment(attachmentId);

      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      // Get the response to check permissions
      const response = await storage.getResponse(attachment.responseId);
      const tenantQuestion = await storage.getTenantQuestion(response!.tenantQuestionId);

      // Ensure user has access to this tenant's data
      const user = req.user!;
      if (user.role !== "Admin" && user.role !== "Consultant" && user.tenantId !== tenantQuestion!.tenantId) {
        return res.status(403).json({ 
          message: "You don't have permission to access this file" 
        });
      }

      const fileBuffer = await fileStorageService.getFile(attachment.filename);

      res.set({
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
        'Content-Length': attachment.size
      });

      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  });

  // Dashboard data
  app.get("/api/tenant/:tenantId/dashboard", async (req, res, next) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const progress = await storage.getTenantProgress(tenantId);

      // Get recent activities (simplified for now)
      const tenantQuestions = await storage.getTenantQuestionsByTenant(tenantId);
      const recentActivities = [];

      for (const tq of tenantQuestions.slice(0, 5)) {
        const responses = await storage.getResponsesByTenantQuestion(tq.id);
        if (responses.length > 0) {
          const latestResponse = responses[responses.length - 1];
          const user = await storage.getUser(latestResponse.userId);
          const question = await storage.getQuestion(tq.questionId);

          recentActivities.push({
            type: 'response',
            user: user ? { 
              id: user.id, 
              fullName: user.fullName, 
              role: user.role 
            } : null,
            questionTitle: question?.title,
            questionId: tq.id,
            date: latestResponse.createdAt
          });
        }
      }

      res.json({
        progress,
        recentActivities: recentActivities.sort((a, b) => 
          b.date.getTime() - a.date.getTime()
        ).slice(0, 5)
      });
    } catch (error) {
      next(error);
    }
  });

  // User Management (Admin only)
  app.get("/api/admin/users", async (req, res, next) => {
    try {
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;

      let users;
      if (tenantId) {
        users = await storage.getUsersByTenant(tenantId);
      } else {
        // Get all users
        users = [];
        for (let i = 1; i < (storage as any).userId; i++) {
          const user = await storage.getUser(i);
          if (user) users.push(user);
        }
      }

      // Don't send passwords to client
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Create a new user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // If this is a tenant registration (has tenantId), assign default questions
      if (user.tenantId) {
        const questions = await storage.getAllQuestions();
        for (const question of questions) {
          await storage.createTenantQuestion({
            tenantId: user.tenantId,
            questionId: question.id,
            status: "Unanswered"
          });
        }
      }
      res.status(201).json(user); //added this line
    } catch (error) {
      next(error);
    }
  });


  // Create the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}