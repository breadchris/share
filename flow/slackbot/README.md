# Slackbot Commands

This Slackbot provides AI-powered assistance for ideation and development workflows.

## Commands

### `/explore` - AI-Powered Ideation

Start an interactive ideation session to explore and expand on your product ideas.

#### Usage
```
/explore <your idea>
```

#### Examples
```
/explore Build a habit tracking app
/explore Create a collaborative note-taking platform
/explore Design a meal planning service for busy families
```

#### How it works

1. **Initial Ideas Generation**: ChatGPT analyzes your idea and generates 5-7 concrete, actionable features
2. **Interactive Feedback**: React with emojis to show your preferences:
   - 👍 **Like** - You find this feature interesting
   - 🔥 **Priority** - This feature is important to you
   - ❤️ **Love** - You really want this feature
   - 👎 **Pass** - This feature doesn't appeal to you

3. **Smart Expansion**: Based on your reactions, the bot generates additional features that align with your preferences

4. **Seamless Handoff**: Use `/flow` in the ideation thread to start building with Claude using your ideation context

#### Feature Information
Each suggested feature includes:
- **Title** and **Category** (Core, Social, Analytics, UX, etc.)
- **Description** explaining the value and functionality
- **Priority Level**: 🔴 High, 🟡 Medium, 🟢 Low
- **Complexity**: 🟢 Simple, 🟡 Medium, 🔴 Complex

#### Example Flow
```
User: /explore Build a habit tracking app

Bot: 🎯 Habit Tracking App - A personal productivity tool to help users build and maintain positive habits through tracking, reminders, and social accountability.

React with emojis to show your interest:
👍 Like  🔥 Priority  ❤️ Love  👎 Pass

**Daily Streak Counter** `Core`
Track consecutive days of habit completion with visual streak indicators and milestone celebrations.

🔴 Priority • 🟢 Complexity

[User reacts with 👍 and 🔥]

Bot: ✨ Based on your reactions, here are some additional ideas:
**Social Habit Challenges** `Social`
Create and join group challenges with friends to stay motivated together.

🟡 Priority • 🟡 Complexity
```

### `/flow` - Claude Development Assistant

Start a Claude session for coding, debugging, and technical implementation.

#### Usage in New Thread
```
/flow <prompt>
/flow <github-url> <description>
```

#### Usage in Ideation Thread
When used in an ideation thread (after `/explore`), Claude receives comprehensive context about your product vision, preferred features, and user feedback.

```
/flow Help me implement the user registration feature
/flow Create the database schema for habit tracking
/flow Build the streak counter component we discussed
```

#### Enhanced Context
When `/flow` is used in an ideation thread, Claude receives:
- **Product Overview**: Your original idea and vision
- **Preferred Features**: Features you reacted positively to
- **User Feedback**: Analysis of your emoji reactions and preferences
- **Technical Guidance**: Architecture suggestions and implementation roadmap

#### Examples
```
# In a new thread
/flow Help me debug this Go code
/flow https://github.com/user/repo.git Add dark mode support

# In an ideation thread (after /explore)
/flow Implement the daily habit tracking feature
/flow Create the user dashboard with streak visualization
```

## Configuration

### Environment Variables

#### Required
- `OPENAI_API_KEY` - Your OpenAI API key for ChatGPT ideation
- `SLACK_BOT_TOKEN` - Your Slack bot token (xoxb-...)
- `SLACK_SIGNING_SECRET` - Your Slack app signing secret

#### Optional
- `SLACKBOT_ENABLED` - Enable/disable the Slackbot (default: false)
- `SLACKBOT_DEBUG` - Enable debug logging (default: true)
- `SLACKBOT_IDEATION_ENABLED` - Enable/disable ideation features (default: true)
- `SLACKBOT_SESSION_TIMEOUT` - Session timeout duration (default: 30m)
- `SLACKBOT_IDEATION_TIMEOUT` - Ideation session timeout (default: 2h)
- `SLACKBOT_MAX_SESSIONS` - Maximum concurrent Claude sessions (default: 10)
- `SLACKBOT_MAX_IDEATION_SESSIONS` - Maximum concurrent ideation sessions (default: 20)
- `SLACKBOT_AUTO_EXPAND_THRESHOLD` - Reactions needed to trigger expansion (default: 2)
- `SLACKBOT_CHANNEL_WHITELIST` - Comma-separated list of allowed channels

### JSON Configuration
```json
{
  "slack_bot": {
    "enabled": true,
    "bot_token": "xoxb-your-bot-token",
    "signing_secret": "your-signing-secret",
    "ideation_enabled": true,
    "ideation_timeout": "2h",
    "max_ideation_sessions": 20,
    "auto_expand_threshold": 2,
    "debug": true,
    "channel_whitelist": ["C1234567890", "general"]
  },
  "openai_key": "your-openai-api-key"
}
```

## Features

### 🧠 Smart Ideation
- **AI-Powered Feature Generation**: ChatGPT creates relevant, actionable features
- **Interactive Feedback**: Emoji reactions guide feature expansion
- **Adaptive Learning**: New suggestions based on your preferences
- **Structured Output**: Features categorized by type, priority, and complexity

### 🤖 Seamless Claude Integration
- **Context-Aware Handoff**: `/flow` receives full ideation context
- **Enhanced Prompts**: Claude understands your product vision and preferences
- **Technical Focus**: Implementation guidance based on preferred features
- **Continuous Context**: Maintains understanding throughout development

### 🔄 Smart Workflow
- **Thread-Based**: Organized conversations in Slack threads
- **Session Management**: Automatic cleanup and resource management
- **Real-Time Updates**: Live feedback and adaptive responses
- **Multi-User Support**: Concurrent ideation and development sessions

## Best Practices

### Effective Ideation
1. **Be Specific**: Provide clear, detailed ideas for better feature suggestions
2. **React Actively**: Use emojis to guide the AI toward your preferences
3. **Iterate**: Let the bot expand ideas based on your feedback
4. **Think Holistically**: Consider features across different categories

### Smooth Development Handoff
1. **Complete Ideation First**: Finish reacting to features before using `/flow`
2. **Be Specific in Requests**: Clear prompts help Claude focus on your priorities
3. **Reference Ideation**: Mention specific features from your ideation session
4. **Iterate in Context**: Continue development conversations in the same thread

### Example Workflow
```
1. /explore Create a fitness app for beginners
2. [React to generated features with 👍, 🔥, ❤️]
3. [Review expanded features and continue reacting]
4. /flow Implement the beginner-friendly workout planner feature
5. [Continue development conversation with Claude]
```

## Troubleshooting

### Common Issues

**Bot doesn't respond to commands**
- Check if the bot is enabled in your channel
- Verify channel whitelist configuration
- Ensure the bot has proper permissions

**OpenAI errors**
- Verify your OpenAI API key is valid and has credits
- Check network connectivity
- Review rate limits

**Missing context in Claude**
- Ensure you're using `/flow` in the same thread as `/explore`
- Check that the ideation session is still active
- Verify OpenAI integration is working

### Debug Mode
Enable debug mode to see detailed logs:
```
SLACKBOT_DEBUG=true
```

This will log:
- Command processing
- ChatGPT requests and responses
- Emoji reaction handling
- Context generation for Claude
- Session management events

## Support

For issues or feature requests:
1. Check the debug logs
2. Verify configuration
3. Review Slack app permissions
4. Test with simple examples first