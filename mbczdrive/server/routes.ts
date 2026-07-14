import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contactFormSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission endpoint
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validatedData = contactFormSchema.parse(req.body);
      
      // Extract data needed for storage (remove privacy field as it's not in our DB schema)
      const { privacy, ...contactData } = validatedData;
      
      // Save the contact form submission
      const contact = await storage.createContact(contactData);
      
      return res.status(201).json({ 
        message: "Votre demande a été envoyée! Nous vous contacterons très prochainement.",
        contact 
      });
    } catch (error) {
      if (error instanceof Error) {
        // Handle Zod validation errors
        if (error.name === "ZodError") {
          const validationError = fromZodError(error);
          return res.status(400).json({ 
            message: "Validation error", 
            errors: validationError.details 
          });
        }
        
        console.error("Error submitting contact form:", error);
        return res.status(500).json({ message: "Une erreur s'est produite lors de l'envoi du formulaire." });
      }
      
      return res.status(500).json({ message: "Une erreur inconnue s'est produite." });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
