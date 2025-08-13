# Google Sheets Integration Setup Guide

## Overview
The Moving Labels app includes Google Sheets integration to sync your moving inventory to the cloud. This allows you to:
- Access your data across multiple devices
- Share inventory with family members
- Create backups in Google Drive
- Collaborate on packing lists

## Demo Mode
For testing purposes, you can use the demo mode:
- **API Key**: `DEMO_KEY`
- **Spreadsheet ID**: Any value (the demo uses mock data)

## Real Google Sheets Setup

### Step 1: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### Step 2: Create Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key (keep it secure!)
4. Optionally, restrict the API key to Google Sheets API only

### Step 3: Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Copy the Spreadsheet ID from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - The ID is the long string between `/d/` and `/edit`

### Step 4: Set Permissions
1. Share your Google Sheet with appropriate permissions:
   - For personal use: Keep private
   - For family sharing: Share with specific people
   - For public access: Make it viewable by anyone with the link

### Step 5: Configure the App
1. Open the Moving Labels app
2. Go to the "Google Sheets" tab
3. Enter your API key and Spreadsheet ID
4. Click "Connect to Google Sheets"

## Data Format
The app creates the following columns in your Google Sheet:
- **Box ID**: Unique identifier for each box
- **Box Name**: Human-readable box name
- **Room**: Room where the box belongs
- **Box Number**: Physical box number (if assigned)
- **Color**: Box label color
- **Item ID**: Unique identifier for each item
- **Item Name**: Name of the item
- **Description**: Item description
- **Category**: Item category
- **Fragile**: Whether the item is fragile (Yes/No)
- **Has Image**: Whether the item has an associated image (Yes/No)

## Security Considerations

### Important Security Notes
- **Never expose API keys in client-side code for production apps**
- **This demo implementation is for educational purposes**
- **For production use, implement server-side authentication**

### Recommended Production Setup
1. **Server-side Implementation**: Use a backend service to handle Google Sheets API calls
2. **OAuth 2.0**: Implement proper OAuth flow for user authentication
3. **Service Accounts**: Use service accounts for server-to-server communication
4. **Environment Variables**: Store credentials in environment variables, not in code

## Troubleshooting

### Common Issues
1. **"API key not valid"**: Check that the API key is correct and the Google Sheets API is enabled
2. **"Permission denied"**: Make sure the sheet is accessible and permissions are set correctly
3. **"Spreadsheet not found"**: Verify the Spreadsheet ID is correct

### API Quotas
Google Sheets API has usage quotas:
- **100 requests per 100 seconds per user**
- **Unlimited requests per day for most use cases**

If you hit quota limits, the app will show an error message.

## Advanced Features

### Automatic Sync
To implement automatic syncing:
1. Set up webhooks using Google Apps Script
2. Use the Google Sheets API's watch feature
3. Implement conflict resolution for simultaneous edits

### Collaboration
For team collaboration:
1. Share the Google Sheet with team members
2. Use Google Sheets' built-in commenting and suggestion features
3. Set up notification rules for changes

### Data Validation
The app validates data before syncing:
- Ensures all required fields are present
- Checks data types and formats
- Prevents duplicate IDs

## API Reference

### Push to Sheets
Uploads current app data to Google Sheets, overwriting existing content.

### Pull from Sheets
Downloads data from Google Sheets and replaces current app data.

### Sync Status
Shows connection status, last sync time, and any errors.

## Support
For issues with Google Sheets integration:
1. Check the troubleshooting section above
2. Verify your Google Cloud Console setup
3. Test with demo mode first
4. Review Google Sheets API documentation

## Privacy
- Data is stored in your personal Google Sheet
- No data is sent to third-party servers (except Google)
- Images are stored as base64 data within the sheet
- You control all access permissions through Google Sheets sharing settings