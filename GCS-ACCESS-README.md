# Google Cloud Storage Access for Mobbin Scraped Data

This document explains how to access the scraped Mobbin data stored in Google Cloud Storage.

## Bucket Information
- **Bucket Name**: `protoflow-ml-training`
- **Path**: `gs://protoflow-ml-training/mobbin-scrapes/`
- **Organization**: Files are organized by timestamp folders (YYYY-MM-DD_HH-MM-SS)

## Service Account Details
- **Service Account**: `mobbin-scraper-access@planar-sun-402202.iam.gserviceaccount.com`
- **Permissions**: 
  - Read/Write objects in the bucket
  - List bucket contents
- **Scope**: Limited to `protoflow-ml-training` bucket only

## Getting Started

### 1. Using the Credentials File
After running the sync test, you'll receive a JSON key file (`mobbin-scraper-access-key.json`). 

**Set up authentication:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="./data/mobbin-scraper-access-key.json"
```

### 2. Install Google Cloud SDK
```bash
# macOS
brew install --cask google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 3. Basic Usage Examples

**List all scraping sessions:**
```bash
gsutil ls gs://protoflow-ml-training/mobbin-scrapes/
```

**List files in a specific scraping session:**
```bash
gsutil ls gs://protoflow-ml-training/mobbin-scrapes/2025-08-05_17-57-10/
```

**Download all files from a session:**
```bash
gsutil -m cp -r gs://protoflow-ml-training/mobbin-scrapes/2025-08-05_17-57-10/ ./local-folder/
```

**Download just the images:**
```bash
gsutil -m cp gs://protoflow-ml-training/mobbin-scrapes/2025-08-05_17-57-10/*.png ./images/
gsutil -m cp gs://protoflow-ml-training/mobbin-scrapes/2025-08-05_17-57-10/*.jpg ./images/
```

**Download metadata:**
```bash
gsutil cp gs://protoflow-ml-training/mobbin-scrapes/2025-08-05_17-57-10/discovered_images.json ./
gsutil cp gs://protoflow-ml-training/mobbin-scrapes/2025-08-05_17-57-10/scraping_results.json ./
```

## File Structure

Each scraping session contains:
```
gs://protoflow-ml-training/mobbin-scrapes/YYYY-MM-DD_HH-MM-SS/
├── extension_img_001_400x400_static.png    # Scraped images with metadata in filename
├── extension_img_002_400x400_dynamic.png   # (static = initial, dynamic = loaded during scroll)
├── ...
├── discovered_images.json                  # Complete metadata for all images
├── scraping_results.json                   # Scraping process results and metrics
└── page_content_extension.html             # Full page HTML after scraping
```

## Programming Access

### Python Example
```python
from google.cloud import storage
import os

# Set credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './data/mobbin-scraper-access-key.json'

# Initialize client
client = storage.Client()
bucket = client.bucket('protoflow-ml-training')

# List all scraping sessions
blobs = bucket.list_blobs(prefix='mobbin-scrapes/')
for blob in blobs:
    print(blob.name)

# Download a specific file
blob = bucket.blob('mobbin-scrapes/2025-08-05_17-57-10/discovered_images.json')
blob.download_to_filename('./discovered_images.json')
```

### Node.js Example
```javascript
const {Storage} = require('@google-cloud/storage');

// Set credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = './data/mobbin-scraper-access-key.json';

const storage = new Storage();
const bucket = storage.bucket('protoflow-ml-training');

// List files
async function listFiles() {
  const [files] = await bucket.getFiles({prefix: 'mobbin-scrapes/'});
  files.forEach(file => console.log(file.name));
}

// Download file
async function downloadFile() {
  await bucket.file('mobbin-scrapes/2025-08-05_17-57-10/discovered_images.json')
    .download({destination: './discovered_images.json'});
}
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Protect the key file** - It contains sensitive credentials
2. **Don't commit to version control** - Add `*-key.json` to .gitignore
3. **Rotate keys periodically** - Generate new keys and delete old ones
4. **Principle of least privilege** - Access is already limited to one bucket
5. **Monitor usage** - Check Cloud Console for unexpected access patterns

## Troubleshooting

**Authentication Issues:**
```bash
# Verify credentials are working
gsutil ls gs://protoflow-ml-training/

# If permission denied, check your key file path
echo $GOOGLE_APPLICATION_CREDENTIALS
```

**Missing Files:**
- Ensure the scraping test completed successfully
- Check the timestamp folder matches when the scraping was run
- Verify sync completed without errors

**Large Downloads:**
```bash
# Use parallel downloads for better performance
gsutil -m cp -r gs://protoflow-ml-training/mobbin-scrapes/SESSION_ID/ ./
```

## Support

For issues with:
- **Access/Permissions**: Check service account key and environment variables
- **Missing Data**: Re-run the scraping and sync tests
- **Large Files**: Use `gsutil -m` for parallel operations