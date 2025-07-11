# Google Sheets Integration Setup Guide

This guide provides step-by-step instructions for setting up Google Sheets integration in your applications.

## Prerequisites

- Google Cloud Platform account
- Google workspace or personal Google account
- Basic knowledge of React/TypeScript

## 1. Google Cloud Console Setup

### Create a New Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter a project name (e.g., "My Sheets App")
4. Click "Create"

### Enable Google Sheets API

1. In the Google Cloud Console, navigate to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click on the result and click **Enable**
4. Wait for the API to be enabled

### Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the generated API key
4. Click **Restrict Key** to configure restrictions:
   - **Application restrictions**: Select "HTTP referrers (web sites)"
   - Add your domain (e.g., `https://yourdomain.com/*`)
   - **API restrictions**: Select "Restrict key" and choose "Google Sheets API"
5. Click **Save**

### Create OAuth 2.0 Client ID

1. In **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a workspace)
   - Fill in required fields:
     - App name: Your application name
     - User support email: Your email
     - Developer contact: Your email
   - Add authorized domains if needed
   - Click **Save and Continue**
4. Select **Web application** as the application type
5. Configure the client:
   - **Name**: Your app name
   - **Authorized JavaScript origins**: Add your domain(s)
     - `https://yourdomain.com`
     - `http://localhost:3000` (for development)
   - **Authorized redirect URIs**: Not needed for this integration
6. Click **Create**
7. Copy the **Client ID** (you don't need the client secret)

## 2. Google Sheets Setup

### Create a Test Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Add some sample data in the first few rows/columns
4. Copy the spreadsheet ID from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### Configure Sharing Permissions

1. Click the **Share** button in your spreadsheet
2. Choose sharing options:
   - **For reading**: Anyone with the link can view
   - **For writing**: Anyone with the link can edit (or restrict to specific users)
3. Click **Done**

## 3. Application Configuration

### Update Template Files

Replace the placeholder values in your chosen template file:

```typescript
// Configuration - replace with your actual credentials
const CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
const API_KEY = 'your-api-key';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SPREADSHEET_ID = 'your-spreadsheet-id';
const RANGE = 'Sheet1!A1:Z100'; // Adjust range as needed
```

### Environment Variables (Recommended)

For production applications, use environment variables:

```typescript
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-client-id';
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'your-api-key';
const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID || 'your-spreadsheet-id';
```

Create a `.env` file in your project root:

```bash
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_API_KEY=your-api-key
REACT_APP_SPREADSHEET_ID=your-spreadsheet-id
```

## 4. Testing Your Integration

### Test Authentication

1. Load your application
2. Click the "Sign In with Google" button
3. Complete the OAuth flow
4. Verify that your user profile appears

### Test Data Reading

1. After authentication, verify that data from your spreadsheet appears
2. Check the browser console for any API errors
3. Ensure the range matches your spreadsheet structure

### Test Data Writing

1. Fill out the form with test data
2. Submit the form
3. Check your Google Sheets to verify the data was written
4. Verify that the success message appears

## 5. Common Issues and Solutions

### Issue: "Access denied" Error

**Solution**: Check your spreadsheet sharing permissions and ensure the OAuth client is properly configured.

### Issue: API Key Restrictions

**Solution**: Verify that your domain is added to the API key restrictions and that the Google Sheets API is enabled.

### Issue: CORS Errors

**Solution**: Ensure your domain is added to the OAuth client's authorized JavaScript origins.

### Issue: Invalid Spreadsheet ID

**Solution**: Double-check the spreadsheet ID from the URL and ensure it's correctly formatted.

### Issue: Range Not Found

**Solution**: Verify that your range (e.g., "Sheet1!A1:Z100") matches your spreadsheet structure.

## 6. Security Best Practices

### API Key Security

- Never commit API keys to version control
- Use environment variables for sensitive data
- Restrict API keys to specific domains and APIs
- Regularly rotate API keys

### OAuth Security

- Use HTTPS in production
- Implement proper error handling
- Validate user tokens on the client side
- Consider implementing token refresh if needed

### Data Security

- Validate all user inputs before sending to Google Sheets
- Implement proper access controls
- Consider data encryption for sensitive information
- Regular security audits of your application

## 7. Production Deployment

### Environment Setup

1. Set up production environment variables
2. Configure your domain in Google Cloud Console
3. Update API key restrictions for production domain
4. Test thoroughly in production environment

### Monitoring

- Monitor API usage in Google Cloud Console
- Set up alerting for API errors
- Track authentication success/failure rates
- Monitor spreadsheet access patterns

## 8. Advanced Configuration

### Custom Scopes

If you need additional permissions, modify the OAuth configuration:

```typescript
// Add additional scopes if needed
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly'
];
```

### Batch Operations

For high-volume applications, consider implementing batch operations:

```typescript
// Example batch update
const batchUpdate = async (updates: Array<{range: string, values: any[][]}>) => {
  await gapi.client.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      data: updates,
      valueInputOption: 'RAW'
    }
  });
};
```

### Error Handling

Implement comprehensive error handling:

```typescript
const handleApiError = (error: any) => {
  switch (error.status) {
    case 403:
      return 'Permission denied. Check sharing settings.';
    case 404:
      return 'Spreadsheet not found.';
    case 429:
      return 'Rate limit exceeded. Please try again later.';
    default:
      return `API error: ${error.message}`;
  }
};
```

## 9. Template Files

This setup guide works with the following template files:

### GoogleSheetsReader.tsx
- Read-only spreadsheet viewer
- User authentication
- Data display with pagination
- Real-time data refresh

### GoogleSheetsWriter.tsx
- Form-based data entry
- Data validation
- Success/error handling
- User profile integration

### GoogleSheetsManager.tsx
- Complete CRUD operations
- Tabbed interface
- Inline editing
- Data management tools

## 10. Support and Resources

### Documentation Links

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google Cloud Console](https://console.cloud.google.com/)

### Community Resources

- [Stack Overflow - Google Sheets API](https://stackoverflow.com/questions/tagged/google-sheets-api)
- [Google Developers Community](https://developers.google.com/community)
- [GitHub Issues and Examples](https://github.com/topics/google-sheets-api)

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Google Cloud Console configuration
3. Test with a simple spreadsheet first
4. Review the Google Sheets API quotas and limits
5. Consult the official documentation

This setup guide should help you get started with Google Sheets integration. Remember to test thoroughly in a development environment before deploying to production.