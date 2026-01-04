#!/bin/bash
# AWS Frontend Resources Cleanup Script
# Removes CloudFront, S3, Route 53 records to stop charges

set -e

echo "🗑️  Starting AWS Frontend Resources Cleanup..."
echo ""

# Configuration - UPDATE THESE VALUES
S3_BUCKET="helloydz.com"
HOSTED_ZONE_ID="Z00634592B0WIZQVAIGWA"  # Your Route 53 hosted zone ID
CLOUDFRONT_DIST_ID=""  # Will auto-detect or set manually

# Step 1: Delete CloudFront Distribution
echo "📦 Step 1: Deleting CloudFront Distribution..."
if [ -z "$CLOUDFRONT_DIST_ID" ]; then
  CLOUDFRONT_DIST_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='CloudFront distribution for helloydz.com React app'].Id" \
    --output text 2>/dev/null || echo "")
fi

if [ -z "$CLOUDFRONT_DIST_ID" ] || [ "$CLOUDFRONT_DIST_ID" == "None" ]; then
  echo "⚠️  CloudFront distribution not found. Skipping..."
else
  echo "   Found Distribution ID: $CLOUDFRONT_DIST_ID"
  
  # Disable distribution
  echo "   ⏳ Disabling distribution (this takes 15-30 minutes)..."
  aws cloudfront get-distribution-config --id $CLOUDFRONT_DIST_ID > /tmp/dist-config.json
  ETAG=$(jq -r '.ETag' /tmp/dist-config.json)
  jq '.DistributionConfig.Enabled = false' /tmp/dist-config.json | jq '.DistributionConfig' > /tmp/dist-config-disabled.json
  aws cloudfront update-distribution --id $CLOUDFRONT_DIST_ID --distribution-config file:///tmp/dist-config-disabled.json --if-match $ETAG
  
  echo "   ⏳ Waiting for distribution to be disabled..."
  aws cloudfront wait distribution-deployed --id $CLOUDFRONT_DIST_ID
  
  # Delete distribution
  echo "   🗑️  Deleting distribution..."
  ETAG=$(aws cloudfront get-distribution-config --id $CLOUDFRONT_DIST_ID --query 'ETag' --output text)
  aws cloudfront delete-distribution --id $CLOUDFRONT_DIST_ID --if-match $ETAG
  echo "   ✅ CloudFront distribution deleted!"
fi

# Step 2: Delete S3 Bucket
echo ""
echo "🗄️  Step 2: Deleting S3 Bucket..."
if aws s3 ls "s3://$S3_BUCKET" 2>/dev/null; then
  echo "   🗑️  Emptying bucket..."
  aws s3 rm s3://$S3_BUCKET --recursive
  echo "   🗑️  Deleting bucket..."
  aws s3 rb s3://$S3_BUCKET
  echo "   ✅ S3 bucket deleted!"
else
  echo "   ⚠️  S3 bucket not found or already deleted. Skipping..."
fi

# Step 3: Delete Route 53 A Record
echo ""
echo "🌐 Step 3: Deleting Route 53 A Record..."
echo "   ⚠️  Please manually delete the Route 53 A record for helloydz.com"
echo "   Or update this script with the correct CloudFront domain name"
echo "   Command: aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file://delete-route53-record.json"

# Clean up temp files
rm -f /tmp/dist-config.json /tmp/dist-config-disabled.json

echo ""
echo "✅ Cleanup complete!"
echo "💰 You should no longer be charged for frontend resources"
echo ""
echo "⚠️  Note: CloudFront deletion may take 15-30 minutes to complete"
echo "   Backend API resources are NOT affected"

