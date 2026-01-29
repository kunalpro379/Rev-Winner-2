import { ActivityHandler, TurnContext, MessageFactory, TeamsInfo, ChannelInfo, TeamsChannelAccount, BotFrameworkAdapter } from 'botbuilder';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { WebSocketServer } from 'ws';
import { Server } from 'http';

export interface TeamsAuthProvider extends AuthenticationProvider {
  getAccessToken(): Promise<string>;
}

export class SalesAssistantBot extends ActivityHandler {
  private graphClient: Client;
  private wsServer?: WebSocketServer;
  private activeConnections = new Map<string, any>();

  constructor(private authProvider: TeamsAuthProvider) {
    super();

    // Initialize Microsoft Graph client
    this.graphClient = Client.initWithMiddleware({
      authProvider: this.authProvider
    });

    // Handle member added events (when bot joins meeting)
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      const welcomeText = 'Hello! I\'m your ServiceNow Sales Assistant. I can help with discovery calls, transcription, and sales coaching during your Teams meetings.';
      
      for (const member of membersAdded!) {
        if (member.id !== context.activity.recipient.id) {
          const welcomeCard = this.createWelcomeCard();
          await context.sendActivity(MessageFactory.attachment(welcomeCard));
        }
      }
      await next();
    });

    // Handle message activities
    this.onMessage(async (context, next) => {
      const userMessage = context.activity.text;
      
      // Check if this is a command to connect to web app
      if (userMessage.toLowerCase().includes('connect') || userMessage.toLowerCase().includes('start sales assistant')) {
        await this.handleConnectCommand(context);
      } else {
        // Echo back for now - will integrate with AI later
        const replyText = `Echo: ${userMessage}`;
        await context.sendActivity(MessageFactory.text(replyText));
      }
      
      await next();
    });

    // Custom handlers for meeting events will be called from the integration layer
  }

  public initializeWebSocket(server: Server) {
    this.wsServer = new WebSocketServer({ 
      server, 
      path: '/teams-ws',
      clientTracking: true 
    });

    this.wsServer.on('connection', (ws, req) => {
      const sessionId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('sessionId');
      
      if (sessionId) {
        this.activeConnections.set(sessionId, ws);
        console.log(`Teams WebSocket connected for session: ${sessionId}`);

        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString());
            await this.handleWebSocketMessage(sessionId, message);
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        });

        ws.on('close', () => {
          this.activeConnections.delete(sessionId);
          console.log(`Teams WebSocket disconnected for session: ${sessionId}`);
        });
      }
    });
  }

  private async handleConnectCommand(context: TurnContext) {
    try {
      // Get meeting information
      const meetingInfo = await TeamsInfo.getMeetingInfo(context);
      const meetingId = meetingInfo?.details?.id;
      
      if (!meetingId) {
        await context.sendActivity(MessageFactory.text('Unable to get meeting information. Please ensure this bot is used within a Teams meeting.'));
        return;
      }

      // Create connection card with deep link to web app
      const connectionCard = this.createConnectionCard(meetingId);
      await context.sendActivity(MessageFactory.attachment(connectionCard));

      // Notify web app about potential connection
      this.broadcastToWebSockets({
        type: 'meeting-available',
        meetingId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error handling connect command:', error);
      await context.sendActivity(MessageFactory.text('Sorry, I encountered an error while trying to connect to your web app.'));
    }
  }

  public async initializeMeetingIntegration(context: TurnContext, meeting: any) {
    try {
      // Get detailed meeting information
      const meetingDetails = await this.graphClient
        .api(`/me/onlineMeetings/${meeting.id}`)
        .get();

      // Initialize audio capture if permissions allow
      await this.setupAudioCapture(meeting.id);

      // Notify web app about meeting start
      this.broadcastToWebSockets({
        type: 'meeting-started',
        meeting: {
          id: meeting.id,
          title: meetingDetails.subject,
          participants: meetingDetails.participants,
          startTime: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error initializing meeting integration:', error);
    }
  }

  public async finalizeMeetingIntegration(context: TurnContext, meeting: any) {
    try {
      // Generate meeting summary
      const summary = await this.generateMeetingSummary(meeting.id);
      
      // Send summary to participants
      const summaryCard = this.createSummaryCard(summary);
      await context.sendActivity(MessageFactory.attachment(summaryCard));

      // Notify web app about meeting end
      this.broadcastToWebSockets({
        type: 'meeting-ended',
        meetingId: meeting.id,
        summary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error finalizing meeting integration:', error);
    }
  }

  private async setupAudioCapture(meetingId: string) {
    try {
      // This would integrate with Teams real-time media APIs
      // For now, we'll set up the infrastructure
      console.log(`Setting up audio capture for meeting: ${meetingId}`);
      
      // In a full implementation, this would:
      // 1. Register for audio stream callbacks
      // 2. Set up media processors
      // 3. Connect to transcription services
      // 4. Stream audio to web app for processing
      
    } catch (error) {
      console.error('Error setting up audio capture:', error);
    }
  }

  private async generateMeetingSummary(meetingId: string): Promise<any> {
    // This would integrate with the AI service to generate summaries
    return {
      meetingId,
      duration: '45 minutes',
      keyTopics: ['ServiceNow ITSM', 'Implementation Timeline', 'Budget Discussion'],
      actionItems: [
        { task: 'Send ITSM demo', owner: 'Sales Rep', dueDate: '2023-10-15' },
        { task: 'Provide implementation timeline', owner: 'Solution Architect', dueDate: '2023-10-12' }
      ],
      nextSteps: 'Schedule technical deep-dive session'
    };
  }

  private createWelcomeCard() {
    return {
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          {
            type: 'TextBlock',
            text: 'ServiceNow Sales Assistant',
            weight: 'Bolder',
            size: 'Medium'
          },
          {
            type: 'TextBlock',
            text: 'I can help you with discovery calls, live transcription, and sales coaching during your Teams meetings.',
            wrap: true
          }
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'Connect to Web App',
            data: { action: 'connect' }
          }
        ]
      }
    };
  }

  private createConnectionCard(meetingId: string) {
    const webAppUrl = process.env.REPLIT_DOMAIN ? 
      `https://${process.env.REPLIT_DOMAIN}` : 
      'http://localhost:5000';
    
    return {
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          {
            type: 'TextBlock',
            text: 'Connect to Sales Assistant',
            weight: 'Bolder',
            size: 'Medium'
          },
          {
            type: 'TextBlock',
            text: 'Click below to open your sales assistant web app and connect it to this Teams meeting.',
            wrap: true
          }
        ],
        actions: [
          {
            type: 'Action.OpenUrl',
            title: 'Open Sales Assistant',
            url: `${webAppUrl}?meetingId=${meetingId}&source=teams`
          }
        ]
      }
    };
  }

  private createSummaryCard(summary: any) {
    return {
      contentType: 'application/vnd.microsoft.card.adaptive', 
      content: {
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          {
            type: 'TextBlock',
            text: 'Meeting Summary',
            weight: 'Bolder',
            size: 'Medium'
          },
          {
            type: 'FactSet',
            facts: [
              { title: 'Duration:', value: summary.duration },
              { title: 'Key Topics:', value: summary.keyTopics.join(', ') },
              { title: 'Next Steps:', value: summary.nextSteps }
            ]
          }
        ]
      }
    };
  }

  private async handleWebSocketMessage(sessionId: string, message: any) {
    // Handle messages from web app
    console.log(`Received WebSocket message from ${sessionId}:`, message);
    
    switch (message.type) {
      case 'start-transcription':
        await this.startTranscription(sessionId, message.meetingId);
        break;
      case 'stop-transcription':
        await this.stopTranscription(sessionId, message.meetingId);
        break;
      case 'request-coaching':
        await this.provideCoaching(sessionId, message.context);
        break;
    }
  }

  private async startTranscription(sessionId: string, meetingId: string) {
    // Start transcription service
    console.log(`Starting transcription for meeting ${meetingId}, session ${sessionId}`);
    
    this.sendToWebSocket(sessionId, {
      type: 'transcription-started',
      meetingId,
      status: 'active'
    });
  }

  private async stopTranscription(sessionId: string, meetingId: string) {
    // Stop transcription service
    console.log(`Stopping transcription for meeting ${meetingId}, session ${sessionId}`);
    
    this.sendToWebSocket(sessionId, {
      type: 'transcription-stopped', 
      meetingId,
      status: 'inactive'
    });
  }

  private async provideCoaching(sessionId: string, context: any) {
    // Generate AI coaching suggestions
    const coaching = {
      suggestions: [
        'Ask about their current pain points with IT service management',
        'Probe for timeline and budget constraints',
        'Highlight ServiceNow\'s ROI potential'
      ],
      nextQuestions: [
        'What\'s your biggest challenge with current IT processes?',
        'How are you currently handling incident management?'
      ]
    };

    this.sendToWebSocket(sessionId, {
      type: 'coaching-suggestions',
      coaching
    });
  }

  private sendToWebSocket(sessionId: string, data: any) {
    const ws = this.activeConnections.get(sessionId);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  public broadcastToWebSockets(data: any) {
    this.activeConnections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }
}

export default SalesAssistantBot;