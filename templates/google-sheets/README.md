# Google Sheets Integration Templates

This directory contains React/TypeScript templates for integrating with Google Sheets using the modern Google Identity Services and Google Sheets API v4.

## Templates Overview

### 1. GoogleSheetsReader.tsx
A read-only component that displays data from Google Sheets in a clean, responsive table format.

**Features:**
- Google Authentication with JWT tokens
- Data fetching from specified spreadsheet ranges
- Responsive table display
- Real-time data refresh
- Loading states and error handling
- User profile display

**Use Cases:**
- Displaying public data from spreadsheets
- Creating dashboards from Google Sheets data
- Building read-only data viewers
- Showing leaderboards or status boards

### 2. GoogleSheetsWriter.tsx
A form-based component for writing data to Google Sheets.

**Features:**
- User authentication flow
- Form validation and submission
- Data writing to spreadsheets
- Success/error feedback
- Auto-populated user information
- Responsive form design

**Use Cases:**
- Contact forms that save to sheets
- Survey and feedback collection
- Event registration forms
- Data entry applications
- Lead generation forms

### 3. GoogleSheetsManager.tsx
A comprehensive CRUD component with full read/write/update/delete capabilities.

**Features:**
- Tabbed interface (Read, Write, Manage)
- Inline editing of existing records
- Data deletion with confirmation
- Batch operations support
- Statistics and data management
- Complete spreadsheet management

**Use Cases:**
- Admin dashboards
- Data management applications
- Customer relationship management
- Inventory management
- Content management systems

## Quick Start

1. **Setup Google Cloud Project** (see SETUP.md for detailed instructions)
   - Create a new Google Cloud project
   - Enable Google Sheets API
   - Create API key and OAuth client ID
   - Configure authorized domains

2. **Configure Your Spreadsheet**
   - Create a Google Sheets document
   - Set appropriate sharing permissions
   - Note the spreadsheet ID from the URL

3. **Update Template Configuration**
   ```typescript
   const CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
   const API_KEY = 'your-api-key';
   const SPREADSHEET_ID = 'your-spreadsheet-id';
   const RANGE = 'Sheet1!A1:Z100'; // Adjust as needed
   ```

4. **Deploy and Test**
   - Deploy your application
   - Test authentication flow
   - Verify data operations work correctly

## Configuration Examples

### Basic Configuration
```typescript
const CLIENT_ID = '123456789-abcdef.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q';
const SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
const RANGE = 'Sheet1!A1:D100';
```

### Environment Variables (Production)
```typescript
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID!;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY!;
const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID!;
const RANGE = process.env.REACT_APP_SHEET_RANGE || 'Sheet1!A1:Z100';
```

### Advanced Configuration
```typescript
const config = {
  CLIENT_ID: '123456789-abcdef.apps.googleusercontent.com',
  API_KEY: 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q',
  DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
  SPREADSHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  SCOPES: ['https://www.googleapis.com/auth/spreadsheets'],
  RANGES: {
    READ: 'Sheet1!A1:D100',
    WRITE: 'Sheet1!A:D',
    METADATA: 'Sheet1!1:1'
  }
};
```

## Common Range Patterns

### Single Column
```typescript
const RANGE = 'Sheet1!A:A'; // Entire column A
```

### Specific Range
```typescript
const RANGE = 'Sheet1!A1:D10'; // First 10 rows, columns A-D
```

### Multiple Sheets
```typescript
const RANGES = {
  users: 'Users!A:E',
  orders: 'Orders!A:F',
  products: 'Products!A:D'
};
```

### Dynamic Range
```typescript
const RANGE = `Sheet1!A1:${getLastColumn()}${getLastRow()}`;
```

## API Usage Examples

### Reading Data
```typescript
const response = await gapi.client.sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Sheet1!A1:D10'
});
const values = response.result.values || [];
```

### Writing Data
```typescript
await gapi.client.sheets.spreadsheets.values.append({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Sheet1!A:D',
  valueInputOption: 'RAW',
  resource: {
    values: [['John', 'Doe', 'john@example.com', new Date().toISOString()]]
  }
});
```

### Updating Data
```typescript
await gapi.client.sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Sheet1!A2:D2',
  valueInputOption: 'RAW',
  resource: {
    values: [['Jane', 'Smith', 'jane@example.com', new Date().toISOString()]]
  }
});
```

### Batch Operations
```typescript
await gapi.client.sheets.spreadsheets.values.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  resource: {
    data: [
      {
        range: 'Sheet1!A2:D2',
        values: [['John', 'Doe', 'john@example.com', new Date().toISOString()]]
      },
      {
        range: 'Sheet1!A3:D3',
        values: [['Jane', 'Smith', 'jane@example.com', new Date().toISOString()]]
      }
    ],
    valueInputOption: 'RAW'
  }
});
```

## Error Handling Examples

### Authentication Errors
```typescript
const handleAuthError = (error: any) => {
  switch (error.type) {
    case 'popup_closed':
      setError('Sign-in was cancelled');
      break;
    case 'access_denied':
      setError('Access denied to Google account');
      break;
    case 'invalid_client':
      setError('Invalid client configuration');
      break;
    default:
      setError(`Authentication error: ${error.message}`);
  }
};
```

### API Errors
```typescript
const handleApiError = (error: any) => {
  if (error.status === 403) {
    setError('Permission denied. Check spreadsheet sharing settings.');
  } else if (error.status === 404) {
    setError('Spreadsheet not found. Verify the spreadsheet ID.');
  } else if (error.status === 429) {
    setError('Rate limit exceeded. Please try again later.');
  } else {
    setError(`API error: ${error.message}`);
  }
};
```

## Best Practices

### Security
- Use environment variables for sensitive configuration
- Implement proper API key restrictions
- Validate all user inputs
- Use HTTPS in production

### Performance
- Implement caching for frequently accessed data
- Use batch operations for multiple updates
- Consider pagination for large datasets
- Implement proper loading states

### User Experience
- Provide clear error messages
- Show loading indicators
- Implement auto-save functionality
- Add confirmation dialogs for destructive operations

### Data Management
- Validate data before writing to sheets
- Implement proper error recovery
- Use meaningful column headers
- Consider data backup strategies

## Files in This Directory

- `GoogleSheetsReader.tsx` - Read-only data viewer
- `GoogleSheetsWriter.tsx` - Data entry form
- `GoogleSheetsManager.tsx` - Complete CRUD interface
- `SETUP.md` - Detailed setup instructions
- `README.md` - This file

## Related Documentation

- [SHEETS.md](../SHEETS.md) - Comprehensive integration guide
- [SETUP.md](./SETUP.md) - Step-by-step setup instructions
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)

## Support

For issues or questions:
1. Check the SETUP.md file for configuration help
2. Review the SHEETS.md documentation
3. Consult the Google Sheets API documentation
4. Test with a simple spreadsheet first
5. Verify your Google Cloud Console settings

These templates provide a solid foundation for Google Sheets integration in modern React applications. Choose the template that best fits your use case and customize as needed.