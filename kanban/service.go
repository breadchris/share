package kanban

import (
	"connectrpc.com/connect"
	"context"
	"fmt"

	"github.com/breadchris/share/gen/proto/kanban"
	"github.com/breadchris/share/gen/proto/kanban/kanbanconnect"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"
)

// Service implements the KanbanService
type Service struct {
	kanbanconnect.UnimplementedKanbanServiceHandler
	db *gorm.DB
}

// NewService creates a new kanban service
func NewService(db *gorm.DB) *Service {
	return &Service{
		db: db,
	}
}

// CreateBoard creates a new kanban board
func (s *Service) CreateBoard(
	ctx context.Context,
	req *connect.Request[kanban.CreateBoardRequest],
) (*connect.Response[kanban.CreateBoardResponse], error) {
	board := &models.KanbanBoard{
		Model: models.Model{
			ID: uuid.New().String(),
		},
		Name:        req.Msg.Name,
		Description: req.Msg.Description,
		UserID:      getUserIDFromContext(ctx),
	}

	if err := s.db.Create(board).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create board: %w", err))
	}

	// Create default columns
	defaultColumns := []string{"To Do", "In Progress", "Done"}
	for i, title := range defaultColumns {
		column := &models.KanbanColumn{
			Model: models.Model{
				ID: uuid.New().String(),
			},
			Title:    title,
			Position: i,
			BoardID:  board.ID,
		}
		if err := s.db.Create(column).Error; err != nil {
			return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create default column: %w", err))
		}
	}

	// Reload board with columns
	if err := s.db.Preload("Columns", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).First(board, "id = ?", board.ID).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to load board: %w", err))
	}

	return connect.NewResponse(&kanban.CreateBoardResponse{
		Board: modelToProtoBoard(board),
	}), nil
}

// GetBoard retrieves a board by ID
func (s *Service) GetBoard(
	ctx context.Context,
	req *connect.Request[kanban.GetBoardRequest],
) (*connect.Response[kanban.GetBoardResponse], error) {
	var board models.KanbanBoard

	if err := s.db.Preload("Columns", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).Preload("Columns.Cards", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).First(&board, "id = ? AND user_id = ?", req.Msg.Id, getUserIDFromContext(ctx)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("board not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to get board: %w", err))
	}

	return connect.NewResponse(&kanban.GetBoardResponse{
		Board: modelToProtoBoard(&board),
	}), nil
}

// ListBoards lists all boards for the current user
func (s *Service) ListBoards(
	ctx context.Context,
	req *connect.Request[kanban.ListBoardsRequest],
) (*connect.Response[kanban.ListBoardsResponse], error) {
	pageSize := req.Msg.PageSize
	if pageSize == 0 || pageSize > 100 {
		pageSize = 20
	}

	var boards []models.KanbanBoard
	query := s.db.Where("user_id = ?", getUserIDFromContext(ctx)).
		Order("created_at DESC").
		Limit(int(pageSize))

	if req.Msg.PageToken != "" {
		query = query.Where("id > ?", req.Msg.PageToken)
	}

	if err := query.Find(&boards).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to list boards: %w", err))
	}

	protoBoards := make([]*kanban.Board, len(boards))
	for i, board := range boards {
		protoBoards[i] = modelToProtoBoard(&board)
	}

	nextPageToken := ""
	if len(boards) == int(pageSize) {
		nextPageToken = boards[len(boards)-1].ID
	}

	return connect.NewResponse(&kanban.ListBoardsResponse{
		Boards:        protoBoards,
		NextPageToken: nextPageToken,
	}), nil
}

// UpdateBoard updates a board's name and description
func (s *Service) UpdateBoard(
	ctx context.Context,
	req *connect.Request[kanban.UpdateBoardRequest],
) (*connect.Response[kanban.UpdateBoardResponse], error) {
	var board models.KanbanBoard
	if err := s.db.First(&board, "id = ? AND user_id = ?", req.Msg.Id, getUserIDFromContext(ctx)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("board not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to find board: %w", err))
	}

	board.Name = req.Msg.Name
	board.Description = req.Msg.Description

	if err := s.db.Save(&board).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update board: %w", err))
	}

	return connect.NewResponse(&kanban.UpdateBoardResponse{
		Board: modelToProtoBoard(&board),
	}), nil
}

// DeleteBoard deletes a board and all its columns and cards
func (s *Service) DeleteBoard(
	ctx context.Context,
	req *connect.Request[kanban.DeleteBoardRequest],
) (*connect.Response[kanban.DeleteBoardResponse], error) {
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.Id, getUserIDFromContext(ctx)).Delete(&models.KanbanBoard{})
	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete board: %w", result.Error))
	}
	if result.RowsAffected == 0 {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("board not found"))
	}

	return connect.NewResponse(&kanban.DeleteBoardResponse{
		Success: true,
	}), nil
}

// CreateColumn creates a new column in a board
func (s *Service) CreateColumn(
	ctx context.Context,
	req *connect.Request[kanban.CreateColumnRequest],
) (*connect.Response[kanban.CreateColumnResponse], error) {
	// Verify board ownership
	var board models.KanbanBoard
	if err := s.db.First(&board, "id = ? AND user_id = ?", req.Msg.BoardId, getUserIDFromContext(ctx)).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("board not found"))
	}

	column := &models.KanbanColumn{
		Model: models.Model{
			ID: uuid.New().String(),
		},
		Title:    req.Msg.Title,
		Position: int(req.Msg.Position),
		BoardID:  req.Msg.BoardId,
	}

	if err := s.db.Create(column).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create column: %w", err))
	}

	return connect.NewResponse(&kanban.CreateColumnResponse{
		Column: modelToProtoColumn(column),
	}), nil
}

// UpdateColumn updates a column's title
func (s *Service) UpdateColumn(
	ctx context.Context,
	req *connect.Request[kanban.UpdateColumnRequest],
) (*connect.Response[kanban.UpdateColumnResponse], error) {
	var column models.KanbanColumn
	if err := s.db.Joins("JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id").
		Where("kanban_columns.id = ? AND kanban_boards.user_id = ?", req.Msg.Id, getUserIDFromContext(ctx)).
		First(&column).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("column not found"))
	}

	column.Title = req.Msg.Title
	if err := s.db.Save(&column).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update column: %w", err))
	}

	return connect.NewResponse(&kanban.UpdateColumnResponse{
		Column: modelToProtoColumn(&column),
	}), nil
}

// DeleteColumn deletes a column and all its cards
func (s *Service) DeleteColumn(
	ctx context.Context,
	req *connect.Request[kanban.DeleteColumnRequest],
) (*connect.Response[kanban.DeleteColumnResponse], error) {
	// Verify ownership through board
	result := s.db.Exec(`
		DELETE FROM kanban_columns 
		WHERE id = ? AND board_id IN (
			SELECT id FROM kanban_boards WHERE user_id = ?
		)`, req.Msg.Id, getUserIDFromContext(ctx))

	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete column: %w", result.Error))
	}
	if result.RowsAffected == 0 {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("column not found"))
	}

	return connect.NewResponse(&kanban.DeleteColumnResponse{
		Success: true,
	}), nil
}

// MoveColumn changes a column's position
func (s *Service) MoveColumn(
	ctx context.Context,
	req *connect.Request[kanban.MoveColumnRequest],
) (*connect.Response[kanban.MoveColumnResponse], error) {
	var column models.KanbanColumn
	if err := s.db.Joins("JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id").
		Where("kanban_columns.id = ? AND kanban_boards.user_id = ?", req.Msg.Id, getUserIDFromContext(ctx)).
		First(&column).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("column not found"))
	}

	// Update positions in a transaction
	err := s.db.Transaction(func(tx *gorm.DB) error {
		oldPosition := column.Position
		newPosition := int(req.Msg.NewPosition)

		if oldPosition == newPosition {
			return nil
		}

		// Update other columns' positions
		if oldPosition < newPosition {
			// Moving right
			if err := tx.Model(&models.KanbanColumn{}).
				Where("board_id = ? AND position > ? AND position <= ?", column.BoardID, oldPosition, newPosition).
				Update("position", gorm.Expr("position - 1")).Error; err != nil {
				return err
			}
		} else {
			// Moving left
			if err := tx.Model(&models.KanbanColumn{}).
				Where("board_id = ? AND position >= ? AND position < ?", column.BoardID, newPosition, oldPosition).
				Update("position", gorm.Expr("position + 1")).Error; err != nil {
				return err
			}
		}

		// Update the column's position
		column.Position = newPosition
		return tx.Save(&column).Error
	})

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to move column: %w", err))
	}

	return connect.NewResponse(&kanban.MoveColumnResponse{
		Column: modelToProtoColumn(&column),
	}), nil
}

// CreateCard creates a new card in a column
func (s *Service) CreateCard(
	ctx context.Context,
	req *connect.Request[kanban.CreateCardRequest],
) (*connect.Response[kanban.CreateCardResponse], error) {
	// Verify column ownership through board
	var column models.KanbanColumn
	if err := s.db.Joins("JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id").
		Where("kanban_columns.id = ? AND kanban_boards.user_id = ?", req.Msg.ColumnId, getUserIDFromContext(ctx)).
		First(&column).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("column not found"))
	}

	card := &models.KanbanCard{
		Model: models.Model{
			ID: uuid.New().String(),
		},
		Title:       req.Msg.Title,
		Description: req.Msg.Description,
		Position:    int(req.Msg.Position),
		ColumnID:    req.Msg.ColumnId,
		AssigneeID:  req.Msg.AssigneeId,
		Labels:      req.Msg.Labels,
	}

	if req.Msg.DueDate != nil {
		card.DueDate = req.Msg.DueDate.AsTime()
	}

	if err := s.db.Create(card).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create card: %w", err))
	}

	return connect.NewResponse(&kanban.CreateCardResponse{
		Card: modelToProtoCard(card),
	}), nil
}

// UpdateCard updates a card's details
func (s *Service) UpdateCard(
	ctx context.Context,
	req *connect.Request[kanban.UpdateCardRequest],
) (*connect.Response[kanban.UpdateCardResponse], error) {
	var card models.KanbanCard
	if err := s.db.Joins("JOIN kanban_columns ON kanban_columns.id = kanban_cards.column_id").
		Joins("JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id").
		Where("kanban_cards.id = ? AND kanban_boards.user_id = ?", req.Msg.Id, getUserIDFromContext(ctx)).
		First(&card).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("card not found"))
	}

	card.Title = req.Msg.Title
	card.Description = req.Msg.Description
	card.AssigneeID = req.Msg.AssigneeId
	card.Labels = req.Msg.Labels

	if req.Msg.DueDate != nil {
		card.DueDate = req.Msg.DueDate.AsTime()
	}

	if err := s.db.Save(&card).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update card: %w", err))
	}

	return connect.NewResponse(&kanban.UpdateCardResponse{
		Card: modelToProtoCard(&card),
	}), nil
}

// DeleteCard deletes a card
func (s *Service) DeleteCard(
	ctx context.Context,
	req *connect.Request[kanban.DeleteCardRequest],
) (*connect.Response[kanban.DeleteCardResponse], error) {
	result := s.db.Exec(`
		DELETE FROM kanban_cards 
		WHERE id = ? AND column_id IN (
			SELECT kc.id FROM kanban_columns kc
			JOIN kanban_boards kb ON kb.id = kc.board_id
			WHERE kb.user_id = ?
		)`, req.Msg.Id, getUserIDFromContext(ctx))

	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete card: %w", result.Error))
	}
	if result.RowsAffected == 0 {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("card not found"))
	}

	return connect.NewResponse(&kanban.DeleteCardResponse{
		Success: true,
	}), nil
}

// MoveCard moves a card to a different column and/or position
func (s *Service) MoveCard(
	ctx context.Context,
	req *connect.Request[kanban.MoveCardRequest],
) (*connect.Response[kanban.MoveCardResponse], error) {
	var card models.KanbanCard
	if err := s.db.Joins("JOIN kanban_columns ON kanban_columns.id = kanban_cards.column_id").
		Joins("JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id").
		Where("kanban_cards.id = ? AND kanban_boards.user_id = ?", req.Msg.Id, getUserIDFromContext(ctx)).
		First(&card).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("card not found"))
	}

	// Verify target column ownership
	var targetColumn models.KanbanColumn
	if err := s.db.Joins("JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id").
		Where("kanban_columns.id = ? AND kanban_boards.user_id = ?", req.Msg.TargetColumnId, getUserIDFromContext(ctx)).
		First(&targetColumn).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("target column not found"))
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		oldColumnID := card.ColumnID
		oldPosition := card.Position
		newPosition := int(req.Msg.NewPosition)

		// If moving within the same column
		if oldColumnID == req.Msg.TargetColumnId {
			if oldPosition == newPosition {
				return nil
			}

			// Update positions in the same column
			if oldPosition < newPosition {
				// Moving down
				if err := tx.Model(&models.KanbanCard{}).
					Where("column_id = ? AND position > ? AND position <= ?", oldColumnID, oldPosition, newPosition).
					Update("position", gorm.Expr("position - 1")).Error; err != nil {
					return err
				}
			} else {
				// Moving up
				if err := tx.Model(&models.KanbanCard{}).
					Where("column_id = ? AND position >= ? AND position < ?", oldColumnID, newPosition, oldPosition).
					Update("position", gorm.Expr("position + 1")).Error; err != nil {
					return err
				}
			}
		} else {
			// Moving to a different column
			// Update positions in the old column
			if err := tx.Model(&models.KanbanCard{}).
				Where("column_id = ? AND position > ?", oldColumnID, oldPosition).
				Update("position", gorm.Expr("position - 1")).Error; err != nil {
				return err
			}

			// Update positions in the new column
			if err := tx.Model(&models.KanbanCard{}).
				Where("column_id = ? AND position >= ?", req.Msg.TargetColumnId, newPosition).
				Update("position", gorm.Expr("position + 1")).Error; err != nil {
				return err
			}

			card.ColumnID = req.Msg.TargetColumnId
		}

		card.Position = newPosition
		return tx.Save(&card).Error
	})

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to move card: %w", err))
	}

	return connect.NewResponse(&kanban.MoveCardResponse{
		Card: modelToProtoCard(&card),
	}), nil
}

// Helper functions

func getUserIDFromContext(ctx context.Context) string {
	// TODO: Implement proper user extraction from context
	// For now, return a placeholder
	return "user-123"
}

func modelToProtoBoard(board *models.KanbanBoard) *kanban.Board {
	protoBoard := &kanban.Board{
		Id:          board.ID,
		Name:        board.Name,
		Description: board.Description,
		UserId:      board.UserID,
		CreatedAt:   timestamppb.New(board.CreatedAt),
		UpdatedAt:   timestamppb.New(board.UpdatedAt),
	}

	if len(board.Columns) > 0 {
		protoBoard.Columns = make([]*kanban.Column, len(board.Columns))
		for i, col := range board.Columns {
			protoBoard.Columns[i] = modelToProtoColumn(&col)
		}
	}

	return protoBoard
}

func modelToProtoColumn(column *models.KanbanColumn) *kanban.Column {
	protoColumn := &kanban.Column{
		Id:        column.ID,
		Title:     column.Title,
		Position:  int32(column.Position),
		BoardId:   column.BoardID,
		CreatedAt: timestamppb.New(column.CreatedAt),
		UpdatedAt: timestamppb.New(column.UpdatedAt),
	}

	if len(column.Cards) > 0 {
		protoColumn.Cards = make([]*kanban.Card, len(column.Cards))
		for i, card := range column.Cards {
			protoColumn.Cards[i] = modelToProtoCard(&card)
		}
	}

	return protoColumn
}

func modelToProtoCard(card *models.KanbanCard) *kanban.Card {
	protoCard := &kanban.Card{
		Id:          card.ID,
		Title:       card.Title,
		Description: card.Description,
		Position:    int32(card.Position),
		ColumnId:    card.ColumnID,
		AssigneeId:  card.AssigneeID,
		Labels:      card.Labels,
		CreatedAt:   timestamppb.New(card.CreatedAt),
		UpdatedAt:   timestamppb.New(card.UpdatedAt),
	}

	if !card.DueDate.IsZero() {
		protoCard.DueDate = timestamppb.New(card.DueDate)
	}

	return protoCard
}
