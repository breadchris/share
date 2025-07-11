package workflow

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// Transformer handles data transformations between nodes
type Transformer struct {
	// Add any configuration or state needed
}

// NewTransformer creates a new transformer
func NewTransformer() *Transformer {
	return &Transformer{}
}

// Transform applies a transformation expression to data
func (t *Transformer) Transform(data interface{}, expression string) (interface{}, error) {
	if expression == "" {
		return data, nil
	}

	// Handle different transformation types
	switch {
	case strings.HasPrefix(expression, "$."):
		return t.jsonPath(data, expression)
	case strings.HasPrefix(expression, "jq:"):
		return t.jqTransform(data, strings.TrimPrefix(expression, "jq:"))
	case strings.HasPrefix(expression, "template:"):
		return t.templateTransform(data, strings.TrimPrefix(expression, "template:"))
	case expression == "stringify":
		return t.stringify(data)
	case expression == "parse":
		return t.parse(data)
	case strings.HasPrefix(expression, "merge:"):
		return t.merge(data, strings.TrimPrefix(expression, "merge:"))
	case strings.HasPrefix(expression, "filter:"):
		return t.filter(data, strings.TrimPrefix(expression, "filter:"))
	default:
		// Try to evaluate as a simple field access
		return t.fieldAccess(data, expression)
	}
}

// jsonPath extracts data using JSONPath-like syntax
func (t *Transformer) jsonPath(data interface{}, path string) (interface{}, error) {
	// Remove leading $
	path = strings.TrimPrefix(path, "$")
	
	// Handle root path
	if path == "" || path == "." {
		return data, nil
	}

	// Split path into segments
	segments := strings.Split(strings.TrimPrefix(path, "."), ".")
	
	current := data
	for _, segment := range segments {
		// Handle array index notation [n]
		if strings.Contains(segment, "[") && strings.Contains(segment, "]") {
			re := regexp.MustCompile(`^(\w+)\[(\d+)\]$`)
			matches := re.FindStringSubmatch(segment)
			if len(matches) == 3 {
				fieldName := matches[1]
				// First navigate to the field
				if fieldName != "" {
					var err error
					current, err = t.getField(current, fieldName)
					if err != nil {
						return nil, err
					}
				}
				// Then handle array access
				current = t.getArrayElement(current, matches[2])
			} else {
				// Just array index
				re = regexp.MustCompile(`^\[(\d+)\]$`)
				matches = re.FindStringSubmatch(segment)
				if len(matches) == 2 {
					current = t.getArrayElement(current, matches[1])
				}
			}
		} else {
			// Regular field access
			var err error
			current, err = t.getField(current, segment)
			if err != nil {
				return nil, err
			}
		}
	}

	return current, nil
}

// getField extracts a field from a map
func (t *Transformer) getField(data interface{}, field string) (interface{}, error) {
	switch v := data.(type) {
	case map[string]interface{}:
		if val, exists := v[field]; exists {
			return val, nil
		}
		return nil, fmt.Errorf("field '%s' not found", field)
	default:
		return nil, fmt.Errorf("cannot access field '%s' on non-map type", field)
	}
}

// getArrayElement extracts an element from an array
func (t *Transformer) getArrayElement(data interface{}, indexStr string) interface{} {
	var index int
	fmt.Sscanf(indexStr, "%d", &index)

	switch v := data.(type) {
	case []interface{}:
		if index >= 0 && index < len(v) {
			return v[index]
		}
	case []map[string]interface{}:
		if index >= 0 && index < len(v) {
			return v[index]
		}
	}
	
	return nil
}

// jqTransform applies a jq-like transformation (simplified)
func (t *Transformer) jqTransform(data interface{}, expression string) (interface{}, error) {
	// This is a placeholder for jq-like transformations
	// In production, you might want to use a proper jq library
	return data, fmt.Errorf("jq transformations not yet implemented")
}

// templateTransform applies a template transformation
func (t *Transformer) templateTransform(data interface{}, template string) (interface{}, error) {
	// Simple template substitution
	result := template

	// Replace {{.field}} with values from data
	if m, ok := data.(map[string]interface{}); ok {
		for key, value := range m {
			placeholder := fmt.Sprintf("{{.%s}}", key)
			replacement := fmt.Sprintf("%v", value)
			result = strings.ReplaceAll(result, placeholder, replacement)
		}
	}

	return result, nil
}

// stringify converts data to JSON string
func (t *Transformer) stringify(data interface{}) (interface{}, error) {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to stringify: %v", err)
	}
	return string(jsonBytes), nil
}

// parse parses JSON string to object
func (t *Transformer) parse(data interface{}) (interface{}, error) {
	str, ok := data.(string)
	if !ok {
		return data, nil // Return as-is if not a string
	}

	var result interface{}
	if err := json.Unmarshal([]byte(str), &result); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %v", err)
	}
	return result, nil
}

// merge merges data with additional fields
func (t *Transformer) merge(data interface{}, mergeSpec string) (interface{}, error) {
	baseMap, ok := data.(map[string]interface{})
	if !ok {
		baseMap = map[string]interface{}{"data": data}
	}

	// Parse merge specification
	var mergeData map[string]interface{}
	if err := json.Unmarshal([]byte(mergeSpec), &mergeData); err != nil {
		return nil, fmt.Errorf("invalid merge specification: %v", err)
	}

	// Merge data
	result := make(map[string]interface{})
	for k, v := range baseMap {
		result[k] = v
	}
	for k, v := range mergeData {
		result[k] = v
	}

	return result, nil
}

// filter filters array data based on criteria
func (t *Transformer) filter(data interface{}, filterExpr string) (interface{}, error) {
	// Simple filter implementation
	// Format: filter:field=value
	parts := strings.Split(filterExpr, "=")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid filter expression: %s", filterExpr)
	}

	field := parts[0]
	value := parts[1]

	// Handle array filtering
	switch v := data.(type) {
	case []interface{}:
		var result []interface{}
		for _, item := range v {
			if m, ok := item.(map[string]interface{}); ok {
				if fieldValue, exists := m[field]; exists {
					if fmt.Sprintf("%v", fieldValue) == value {
						result = append(result, item)
					}
				}
			}
		}
		return result, nil
	case []map[string]interface{}:
		var result []map[string]interface{}
		for _, item := range v {
			if fieldValue, exists := item[field]; exists {
				if fmt.Sprintf("%v", fieldValue) == value {
					result = append(result, item)
				}
			}
		}
		return result, nil
	default:
		return nil, fmt.Errorf("filter can only be applied to arrays")
	}
}

// fieldAccess performs simple field access
func (t *Transformer) fieldAccess(data interface{}, field string) (interface{}, error) {
	if m, ok := data.(map[string]interface{}); ok {
		if val, exists := m[field]; exists {
			return val, nil
		}
	}
	return nil, fmt.Errorf("field '%s' not found", field)
}

// BatchTransform applies multiple transformations to data
func (t *Transformer) BatchTransform(data interface{}, transformations []string) (interface{}, error) {
	result := data
	var err error

	for _, transform := range transformations {
		result, err = t.Transform(result, transform)
		if err != nil {
			return nil, fmt.Errorf("transformation '%s' failed: %v", transform, err)
		}
	}

	return result, nil
}

// TransformMap applies different transformations to different fields
func (t *Transformer) TransformMap(data interface{}, transformMap map[string]string) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	for outputField, transform := range transformMap {
		value, err := t.Transform(data, transform)
		if err != nil {
			return nil, fmt.Errorf("failed to transform field '%s': %v", outputField, err)
		}
		result[outputField] = value
	}

	return result, nil
}