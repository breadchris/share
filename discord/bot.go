package discord

import (
	"context"
	"fmt"
	"github.com/breadchris/share/deps"
	"github.com/bwmarrin/discordgo"
	"github.com/sashabaranov/go-openai"
	"log/slog"
)

const (
	questionOption    = "question"
	descriptionOption = "description"
	defaultPersona    = "You are the most interesting man in the world."
)

type Bot struct {
	d             *deps.Deps
	personaLookup map[string]string
}

func NewBot(d *deps.Deps) *Bot {
	return &Bot{
		d:             d,
		personaLookup: map[string]string{},
	}
}

func (b *Bot) PersonaCmd(ctx context.Context, s *discordgo.Session, i *discordgo.InteractionCreate) {
	slog.Debug("persona command", "options", i.ApplicationCommandData().Options)
	options := i.ApplicationCommandData().Options
	optionMap := make(map[string]*discordgo.ApplicationCommandInteractionDataOption, len(options))
	for _, opt := range options {
		optionMap[opt.Name] = opt
	}

	desc := ""
	if option, ok := optionMap[descriptionOption]; ok {
		desc = option.StringValue()
		b.personaLookup[i.Interaction.ChannelID] = desc
	}
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
	})
	if err != nil {
		slog.Error("failed to acknowledge persona command", "error", err)
		return
	}
	answer := "ok!"
	_, err = s.InteractionResponseEdit(i.Interaction, &discordgo.WebhookEdit{
		Content: &answer,
	})
	if err != nil {
		slog.Error("failed to acknowledge persona command", "error", err)
		return
	}
}

func (b *Bot) AskCmd(ctx context.Context, s *discordgo.Session, i *discordgo.InteractionCreate) {
	slog.Debug("ask command", "options", i.ApplicationCommandData().Options)
	options := i.ApplicationCommandData().Options
	optionMap := make(map[string]*discordgo.ApplicationCommandInteractionDataOption, len(options))
	for _, opt := range options {
		optionMap[opt.Name] = opt
	}

	question := ""
	if option, ok := optionMap[questionOption]; ok {
		question = option.StringValue()
	}
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
	})
	if err != nil {
		slog.Error("failed to acknowledge ask command", "error", err)
		return
	}
	answer := "hold up..."
	_, err = s.InteractionResponseEdit(i.Interaction, &discordgo.WebhookEdit{
		Content: &answer,
	})

	persona := defaultPersona
	if p, ok := b.personaLookup[i.Interaction.ChannelID]; ok {
		persona = p
	}

	res, err := b.d.AI.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4oMini,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    "system",
				Content: fmt.Sprintf("You are a chatbot. You are here to help me with my questions. %s", persona),
			},
			{
				Role:    "user",
				Content: fmt.Sprintf("%s Answer this question: %s", persona, question),
			},
		},
	})
	if err != nil {
		slog.Error("failed to respond to ask command", "error", err)
		answer = "whups, something went wrong"
		_, err = s.InteractionResponseEdit(i.Interaction, &discordgo.WebhookEdit{
			Content: &answer,
		})
		return
	}

	answer = res.Choices[0].Message.Content
	_, err = s.InteractionResponseEdit(i.Interaction, &discordgo.WebhookEdit{
		Content: &answer,
	})
	if err != nil {
		slog.Error("failed to respond to ask command", "error", err)
		return
	}
}
