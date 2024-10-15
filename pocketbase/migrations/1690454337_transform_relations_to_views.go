package migrations

import (
	"github.com/breadchris/share/pocketbase/daos"
	"github.com/breadchris/share/pocketbase/models"
	"github.com/breadchris/share/pocketbase/models/schema"
	"github.com/pocketbase/dbx"
)

// Transform the relation fields to views from non-view collections to json or text fields
// (see https://github.com/breadchris/share/pocketbase/issues/3000).
func init() {
	AppMigrations.Register(func(db dbx.Builder) error {
		dao := daos.New(db)

		views, err := dao.FindCollectionsByType(models.CollectionTypeView)
		if err != nil {
			return err
		}

		for _, view := range views {
			refs, err := dao.FindCollectionReferences(view)
			if err != nil {
				return nil
			}

			for collection, fields := range refs {
				if collection.IsView() {
					continue // view-view relations are allowed
				}

				for _, f := range fields {
					opt, ok := f.Options.(schema.MultiValuer)
					if !ok {
						continue
					}

					if opt.IsMultiple() {
						f.Type = schema.FieldTypeJson
						f.Options = &schema.JsonOptions{}
					} else {
						f.Type = schema.FieldTypeText
						f.Options = &schema.TextOptions{}
					}

					// replace the existing field
					// (this usually is not necessary since it is a pointer,
					// but it is better to be explicit in case FindCollectionReferences changes)
					collection.Schema.AddField(f)
				}

				// "raw" save without records table sync
				if err := dao.Save(collection); err != nil {
					return err
				}
			}
		}

		return nil
	}, nil)
}
