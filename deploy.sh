#!/bin/bash
# Manual deployment script for helloUI to AWS S3 + CloudFront

set -e

# Configuration
S3_BUCKET="helloydz.com"
CLOUDFRONT_DIST_ID="" # Add your CloudFront distribution ID here
AWS_REGION="us-east-1"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Building React app for production...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Uploading static assets to S3...${NC}"
# Upload all files except HTML with long cache
aws s3 sync build/ s3://${S3_BUCKET}/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "service-worker.js" \
  --exclude "asset-manifest.json" \
  --region ${AWS_REGION}

echo -e "${BLUE}📦 Uploading HTML files with no-cache...${NC}"
# Upload HTML files with no cache
aws s3 sync build/ s3://${S3_BUCKET}/ \
  --exclude "*" \
  --include "*.html" \
  --include "service-worker.js" \
  --include "asset-manifest.json" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --region ${AWS_REGION}

if [ -n "$CLOUDFRONT_DIST_ID" ]; then
    echo -e "${BLUE}🔄 Creating CloudFront invalidation...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
      --distribution-id ${CLOUDFRONT_DIST_ID} \
      --paths "/*" \
      --query 'Invalidation.Id' \
      --output text)
    
    echo -e "${GREEN}✅ Invalidation created: ${INVALIDATION_ID}${NC}"
    echo -e "${BLUE}⏳ Waiting for invalidation to complete (this may take a few minutes)...${NC}"
    
    aws cloudfront wait invalidation-completed \
      --distribution-id ${CLOUDFRONT_DIST_ID} \
      --id ${INVALIDATION_ID}
    
    echo -e "${GREEN}✅ CloudFront cache invalidated!${NC}"
else
    echo -e "${RED}⚠️  CLOUDFRONT_DIST_ID not set. Skipping cache invalidation.${NC}"
    echo -e "${RED}   Please update this script with your CloudFront distribution ID.${NC}"
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your app is live at: https://helloydz.com${NC}"

