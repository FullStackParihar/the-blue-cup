import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";

class WhatsAppService {
  private client: Client;
  private isReady: boolean = false;
  private io: SocketIOServer | null = null;

  constructor() {
    // Programmatic cleanup of browser lock
    const lockPath = path.join(process.cwd(), ".wwebjs_auth/session/SingletonLock");
    if (fs.existsSync(lockPath)) {
      try {
        fs.unlinkSync(lockPath);
        logger.info("🧹 Cleared stale WhatsApp browser lock at: " + lockPath);
      } catch (err) {
        logger.warn("⚠️ Could not clear WhatsApp lock automatically: " + (err as Error).message);
      }
    }

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process", // <- This can help with lock issues
          "--disable-gpu"
        ],
      },
    });

    this.client.on("qr", (qr) => {
      logger.info("📱 WhatsApp QR Code Received. Please scan with your phone:");
      qrcode.generate(qr, { small: true });
      if (this.io) {
        this.io.emit("whatsapp-qr", qr);
      }
    });

    this.client.on("ready", () => {
      logger.info("✅ WhatsApp Client is Ready!");
      this.isReady = true;
      if (this.io) {
        this.io.emit("whatsapp-status", "ready");
      }
    });

    this.client.on("auth_failure", (msg) => {
      logger.error("❌ WhatsApp Authentication Failure:", msg);
      if (this.io) {
        this.io.emit("whatsapp-status", "unauthenticated");
      }
    });

    this.client.on("disconnected", (reason) => {
      logger.warn("🔌 WhatsApp Disconnected:", reason);
      this.isReady = false;
      if (this.io) {
        this.io.emit("whatsapp-status", "disconnected");
      }
    });

    // Small delay to ensure lock cleanup is finalized
    setTimeout(() => {
      this.client.initialize();
    }, 2000);

    // Cleanup on process exit
    const cleanup = async () => {
      logger.info("👋 Closing WhatsApp client...");
      try {
        await this.client.destroy();
      } catch (err) {
        // Ignore errors during cleanup
      }
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }

  public setIo(io: SocketIOServer) {
    this.io = io;
    // Emit current status to the newly connected io
    if (this.isReady) {
      this.io.emit("whatsapp-status", "ready");
    }
  }

  public async sendMessage(phone: string, message: string, pdfBuffer?: Buffer, fileName?: string) {
    if (!this.isReady) {
      logger.warn("⚠️ WhatsApp Client not ready. Message not sent.");
      return;
    }

    try {
      // Format phone number: strip non-digits and add country code if missing
      let formattedPhone = phone.replace(/\D/g, "");
      if (formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`;
      }
      const chatId = `${formattedPhone}@c.us`;

      if (pdfBuffer && fileName) {
        const media = new MessageMedia(
          "application/pdf",
          pdfBuffer.toString("base64"),
          fileName
        );
        await this.client.sendMessage(chatId, media, { caption: message });
      } else {
        await this.client.sendMessage(chatId, message);
      }
      
      logger.info(`📤 WhatsApp bill sent to ${formattedPhone}`);
    } catch (error) {
      logger.error(`❌ Failed to send WhatsApp message to ${phone}:`, error);
    }
  }
}

export const whatsappService = new WhatsAppService();
