import { Express, Request, Response } from 'express';
import { BotFrameworkAdapter } from 'botbuilder';
import SalesAssistantBot from './teams-bot';
import TeamsOAuthProvider from './teams-auth';
import TeamsMediaProcessor from './teams-media';
import { IStorage } from './storage';
import { AUDIO_SOURCE_TYPES, type Conversation } from '../shared/schema';

export interface TeamsIntegrationConfig {
  microsoftAppId: string;
  microsoftAppPassword: string;
  oauthRedirectUri: string;
}

export class TeamsIntegration {
  private bot: SalesAssistantBot;
  private adapter: BotFrameworkAdapter;
  private authProvider: TeamsOAuthProvider;
  private mediaProcessor: TeamsMediaProcessor;

  constructor(
    private app: Express,
    private storage: IStorage,
    config: Partial<TeamsIntegrationConfig> = {}
  ) {
    // Initialize auth provider
    this.authProvider = new TeamsOAuthProvider();
    
    // Initialize media processor
    this.mediaProcessor = new TeamsMediaProcessor();
    
    // Initialize bot
    this.bot = new SalesAssistantBot(this.authProvider);
    
    // Initialize Bot Framework adapter
    this.adapter = new BotFrameworkAdapter({
      appId: config.microsoftAppId || process.env.MICROSOFT_APP_ID,
      appPassword: config.microsoftAppPassword || process.env.MICROSOFT_APP_PASSWORD
    });

    // Setup error handling
    this.adapter.onTurnError = async (context, error) => {
      console.error('Bot framework error:', error);
      await context.sendActivity('Sorry, an error occurred while processing your request.');
    };

    this.setupRoutes();
    this.setupEventHandlers();
  }

  private setupRoutes() {
    // Bot Framework messaging endpoint
    this.app.post('/api/teams/messages', async (req: Request, res: Response) => {
      await this.adapter.processActivity(req, res, async (context) => {
        await this.bot.run(context);
      });
    });

    // OAuth initiation
    this.app.get('/api/teams/auth/login', async (req: Request, res: Response) => {
      try {
        const sessionId = req.query.sessionId as string;
        const meetingId = req.query.meetingId as string;
        
        if (!sessionId) {
          return res.status(400).json({ error: 'Session ID required' });
        }

        const state = JSON.stringify({ sessionId, meetingId });
        const authUrl = await this.authProvider.getAuthUrl([
          'https://graph.microsoft.com/User.Read',
          'https://graph.microsoft.com/OnlineMeetings.Read.All',
          'https://graph.microsoft.com/Calls.AccessMedia.All'
        ], state);

        res.json({ authUrl });
      } catch (error) {
        console.error('Error initiating OAuth:', error);
        res.status(500).json({ error: 'Failed to initiate authentication' });
      }
    });

    // OAuth callback
    this.app.get('/api/teams/auth/callback', async (req: Request, res: Response) => {
      try {
        const code = req.query.code as string;
        const state = req.query.state as string;
        
        if (!code) {
          return res.status(400).json({ error: 'Authorization code required' });
        }

        const result = await this.authProvider.handleCallback(code);
        const stateData = state ? JSON.parse(state) : {};
        
        // Store authentication result
        await this.handleSuccessfulAuth(stateData.sessionId, stateData.meetingId, result);
        
        // Redirect back to the app with success
        const redirectUrl = `/?sessionId=${stateData.sessionId}&authSuccess=true&meetingId=${stateData.meetingId || ''}`;
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        res.redirect('/?authError=true');
      }
    });

    // Start Teams meeting integration
    this.app.post('/api/teams/meetings/:meetingId/connect', async (req: Request, res: Response) => {
      try {
        const { meetingId } = req.params;
        const { sessionId } = req.body;

        if (!sessionId) {
          return res.status(400).json({ error: 'Session ID required' });
        }

        const success = await this.connectToMeeting(sessionId, meetingId);
        
        if (success) {
          res.json({ status: 'connected', meetingId });
        } else {
          res.status(500).json({ error: 'Failed to connect to meeting' });
        }
      } catch (error) {
        console.error('Error connecting to meeting:', error);
        res.status(500).json({ error: 'Failed to connect to meeting' });
      }
    });

    // Disconnect from Teams meeting
    this.app.post('/api/teams/meetings/:meetingId/disconnect', async (req: Request, res: Response) => {
      try {
        const { meetingId } = req.params;
        const { sessionId } = req.body;

        await this.disconnectFromMeeting(sessionId, meetingId);
        res.json({ status: 'disconnected', meetingId });
      } catch (error) {
        console.error('Error disconnecting from meeting:', error);
        res.status(500).json({ error: 'Failed to disconnect from meeting' });
      }
    });

    // Get meeting status
    this.app.get('/api/teams/meetings/:meetingId/status', async (req: Request, res: Response) => {
      try {
        const { meetingId } = req.params;
        const isActive = this.mediaProcessor.isProcessingActive(meetingId);
        
        res.json({ 
          meetingId, 
          status: isActive ? 'connected' : 'disconnected',
          audioProcessing: isActive
        });
      } catch (error) {
        console.error('Error getting meeting status:', error);
        res.status(500).json({ error: 'Failed to get meeting status' });
      }
    });

    // Start transcription
    this.app.post('/api/teams/meetings/:meetingId/transcription/start', async (req: Request, res: Response) => {
      try {
        const { meetingId } = req.params;
        const { sessionId } = req.body;

        const success = await this.mediaProcessor.startAudioProcessing(meetingId);
        
        if (success) {
          // Create audio source record
          await this.storage.createAudioSource({
            conversationId: await this.getConversationId(sessionId),
            sourceType: AUDIO_SOURCE_TYPES.TEAMS_MEETING,
            sourceId: meetingId,
            teamsMeetingId: undefined, // Will be set later
            metadata: { startedAt: new Date().toISOString() }
          });

          res.json({ status: 'started', meetingId });
        } else {
          res.status(500).json({ error: 'Failed to start transcription' });
        }
      } catch (error) {
        console.error('Error starting transcription:', error);
        res.status(500).json({ error: 'Failed to start transcription' });
      }
    });

    // Stop transcription
    this.app.post('/api/teams/meetings/:meetingId/transcription/stop', async (req: Request, res: Response) => {
      try {
        const { meetingId } = req.params;
        
        await this.mediaProcessor.stopAudioProcessing(meetingId);
        res.json({ status: 'stopped', meetingId });
      } catch (error) {
        console.error('Error stopping transcription:', error);
        res.status(500).json({ error: 'Failed to stop transcription' });
      }
    });
  }

  private setupEventHandlers() {
    // Handle transcription results
    this.mediaProcessor.on('transcription', async (result) => {
      console.log('Transcription received:', result);
      
      // Broadcast transcription to connected clients
      this.bot.broadcastToWebSockets({
        type: 'live-transcription',
        transcription: result
      });

      // Store transcription as message if it's substantial
      if (result.text.length > 10 && result.isFinal) {
        try {
          // Find conversation for this meeting
          const conversation = await this.findConversationByMeeting(result.meetingId);
          if (conversation) {
            await this.storage.addMessage({
              conversationId: conversation.id,
              content: result.text,
              sender: result.participantId || 'participant',
              audioSourceId: undefined // Would link to audio source if available
            });
          }
        } catch (error) {
          console.error('Error storing transcription message:', error);
        }
      }
    });

    // Handle audio processing events
    this.mediaProcessor.on('audio-processing-started', (data) => {
      console.log('Audio processing started for meeting:', data.meetingId);
    });

    this.mediaProcessor.on('audio-processing-stopped', (data) => {
      console.log('Audio processing stopped for meeting:', data.meetingId);
    });

    this.mediaProcessor.on('error', (error) => {
      console.error('Media processor error:', error);
    });
  }

  public initializeWebSocket(server: any) {
    this.bot.initializeWebSocket(server);
  }

  private async handleSuccessfulAuth(sessionId: string, meetingId: string, authResult: any) {
    try {
      // Store authentication state
      console.log(`Authentication successful for session ${sessionId}, meeting ${meetingId}`);
      
      // If meeting ID provided, attempt to connect
      if (meetingId) {
        await this.connectToMeeting(sessionId, meetingId);
      }
    } catch (error) {
      console.error('Error handling successful auth:', error);
    }
  }

  private async connectToMeeting(sessionId: string, meetingId: string): Promise<boolean> {
    try {
      // Get or create conversation
      const conversationId = await this.getConversationId(sessionId);
      
      // Create Teams meeting record
      const meeting = await this.storage.createTeamsMeeting({
        conversationId,
        meetingId,
        meetingTitle: `Teams Meeting ${meetingId}`,
        organizerId: 'unknown', // Would get from Graph API
        startTime: new Date(),
        participants: []
      });

      console.log(`Connected to Teams meeting ${meetingId} for session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error connecting to meeting:', error);
      return false;
    }
  }

  private async disconnectFromMeeting(sessionId: string, meetingId: string) {
    try {
      // Stop audio processing
      await this.mediaProcessor.stopAudioProcessing(meetingId);
      
      // Update meeting record
      // Would update endTime and status in database
      
      console.log(`Disconnected from Teams meeting ${meetingId} for session ${sessionId}`);
    } catch (error) {
      console.error('Error disconnecting from meeting:', error);
    }
  }

  private async getConversationId(sessionId: string): Promise<string> {
    const conversation = await this.storage.getConversation(sessionId);
    if (!conversation) {
      throw new Error(`No conversation found for session: ${sessionId}`);
    }
    return conversation.id;
  }

  private async findConversationByMeeting(meetingId: string): Promise<Conversation | null> {
    // This would query the database to find conversation associated with the meeting
    // For now, returning null as placeholder since we don't have getAllConversations
    // In a full implementation, this would search through all conversations to find
    // the one associated with this meetingId
    console.log(`Looking for conversation for meeting: ${meetingId}`);
    return null;
  }
}

export default TeamsIntegration;