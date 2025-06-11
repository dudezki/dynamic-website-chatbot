import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as nodemailer from 'nodemailer';

@Injectable()
export class GeminiService {
  private readonly aiPersona = `
    TRANSFER TO HUMAN AGENT:
      If the user requests to speak with a human agent, politely ask for their name, contact number, and email address so that a human agent can contact them. Follow this specific sequence:
        1. "I can connect you with a human agent. To start, could I please get your full name?"
        2. Once name is provided: "Thank you, [User's Name]! And what's your email address?"
        3. Once email is provided: "Perfect. Lastly, your phone number please?"
      After collecting the name, email, and phone number, respond with the following message including the special marker:
      "[HUMAN_AGENT_DETAILS name='[User's Name]' email='[User's Email]' phone='[User's Phone]'] Thank you! I'm connecting you to a human agent now. Please wait a moment."
        - Do a stall message like "Please hold on while I connect you to a human agent."
        - I'm sorry, all our agents are currently busy. Please hold on while I connect you to a human agent.
  `;
   
   

  private model: any;
  private leads: any[] = [];
  private readonly apiKey = 'AIzaSyC29Anz4hc6Lt1zTGZTNsF79RbHwC0gAJg';
  private readonly LEAD_MARKER_REGEX = /\[LEAD_DETAILS_COLLECTED name="([^"]*)" email="([^"]*)" phone="([^"]*)" notes="([^"]*)"\]/;
  private readonly gmailUser = 'lfaderon@gmail.com';
  private readonly gmailPass = 'fzcmxffbmnmkrokb';
  private readonly conversations: Map<string, string[]> = new Map(); // Store conversation history
  gmailRecipient: string;

  constructor() {
    this.model = new GoogleGenerativeAI(this.apiKey).getGenerativeModel({ model: 'emini-2.0-flash' });
  }

  async generateResponse(prompt: string): Promise<string> {
    const userId = 'default_user'; // Replace with a proper user ID if available
    let conversationHistory = this.conversations.get(userId) || [];

    conversationHistory.push(`User: ${prompt}`);

    const combinedPrompt = `${this.aiPersona}\n${conversationHistory.join('\n')}`;
    try {
      const result = await this.model.generateContent(combinedPrompt);
      const responseText = result.response.text();

      conversationHistory.push(`AI: ${responseText}`);
      this.conversations.set(userId, conversationHistory);

      const leadMatch = responseText.match(this.LEAD_MARKER_REGEX);
      const humanAgentMatch = responseText.match(/\[HUMAN_AGENT_DETAILS name='([^']*)' email='([^']*)' phone='([^']*)'\]/);

      if (leadMatch) {
        const [, name, collectedEmail, phone, notes] = leadMatch;
        const userFacingConfirmationFromGemini = responseText.replace(this.LEAD_MARKER_REGEX, "").trim();

        try {
          await this.sendEmail(name, collectedEmail, phone, notes);
          return `${userFacingConfirmationFromGemini} Is there anything else I can help you with, ${name}?`;
        } catch (apiError: any) {
          console.error('Error sending email via Nodemailer:', apiError);
          return `Great, I have your information: Name: ${name}, Email: ${collectedEmail}, Phone: ${phone}. Our team has been notified and will reach out to you soon. Thanks! Is there anything else I can help you with, ${name}?`;
        }
      } else if (humanAgentMatch) {
        const [, name, email, phone] = humanAgentMatch;
        try {
          await this.sendHumanAgentEmail(name, email, phone);
          return responseText.replace(/\[HUMAN_AGENT_DETAILS name='([^']*)' email='([^']*)' phone='([^']*)'\]/, "").trim();
        } catch (apiError: any) {
          console.error('Error sending human agent email via Nodemailer:', apiError);
          return "There was an error connecting you to a human agent. Please try again later.";
        }
      }

      return responseText;

    } catch (error: any) {
      console.error('Error generating content:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      return 'Sorry, I encountered an error while processing your request.';
    }
  }

  private processPrompt(prompt: string): string {
    // This method is no longer directly used, but kept for potential future use
    return `Okay, I understand. Let me see... ${prompt}`;
  }

  private async sendEmail(name: string, collectedEmail: string, phone: string, notes: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.gmailUser,
        pass: this.gmailPass,
      },
    });

    const mailOptions = {
      from: this.gmailUser,
      to: 'lfaderon@gmail.com',
      subject: 'AI Assistant - Lead Alert',
      text: `A new lead has been captured by theAI Assistant:\n\nDate: ${new Date().toLocaleString()}\nName: ${name}\nEmail: ${collectedEmail}\nPhone: ${phone}\nNotes: ${notes || "N/A"}\n\nPlease follow up with this lead.\nThe client's email for direct reply is: ${collectedEmail}.`,
      replyTo: collectedEmail,
    };

    await transporter.sendMail(mailOptions);
  }

  private async sendHumanAgentEmail(name: string, email: string, phone: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.gmailUser,
        pass: this.gmailPass,
      },
    });

    const mailOptions = {
      from: this.gmailUser,
      to: 'lfaderon@gmail.com',
      subject: 'AI Assistant - Human Agent Transfer Request',
      text: `A user has requested to be transferred to a human agent:\n\nDate: ${new Date().toLocaleString()}\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nPlease contact this user as soon as possible.`,
      replyTo: email,
    };

    await transporter.sendMail(mailOptions);
  }
}
