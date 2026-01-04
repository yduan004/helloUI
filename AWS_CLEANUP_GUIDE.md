# AWS Frontend Resources Cleanup Guide

Complete guide to remove all AWS frontend resources and stop charges.

---

## ⚠️ What Will Be Deleted

- ✅ **CloudFront Distribution** - CDN for frontend
- ✅ **S3 Bucket** - Static file storage
- ✅ **Route 53 A Record** - DNS record for helloydz.com
- ✅ **ACM Certificate** (optional) - Only if not used by backend
- ✅ **IAM Resources** (optional) - Only if created for frontend

---

## 🚫 What Will NOT Be Deleted

These backend resources remain intact:
- ✅ ECS Cluster & Service
- ✅ ALB (Application Load Balancer)
- ✅ RDS Database
- ✅ ECR Repository
- ✅ Secrets Manager
- ✅ Route 53 Hosted Zone
- ✅ ACM Certificate (if shared with backend)
- ✅ VPC, Subnets, Security Groups

**Your backend API will continue to work!**

---

## 🗑️ Step-by-Step Cleanup

### Step 1: Delete CloudFront Distribution

**⚠️ Important**: CloudFront must be **disabled** before deletion (takes 15-30 minutes).

```bash
# Get your CloudFront distribution ID
DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='CloudFront distribution for helloydz.com React app'].Id" \
  --output text)

echo "Distribution ID: $DIST_ID"

# Disable the distribution
aws cloudfront get-distribution-config --id $DIST_ID > dist-config.json
ETAG=$(jq -r '.ETag' dist-config.json)
jq '.DistributionConfig.Enabled = false' dist-config.json | jq '.DistributionConfig' > dist-config-disabled.json
aws cloudfront update-distribution --id $DIST_ID --distribution-config file://dist-config-disabled.json --if-match $ETAG

# Wait for distribution to be disabled (15-30 minutes)
echo "⏳ Waiting for CloudFront to be disabled..."
aws cloudfront wait distribution-deployed --id $DIST_ID

# Delete the distribution
ETAG=$(aws cloudfront get-distribution-config --id $DIST_ID --query 'ETag' --output text)
aws cloudfront delete-distribution --id $DIST_ID --if-match $ETAG

echo "✅ CloudFront distribution deleted!"
```

**Alternative (if you know the distribution ID)**:
```bash
# Replace E1234567890ABC with your actual distribution ID
DIST_ID="E1234567890ABC"

# Disable
aws cloudfront get-distribution-config --id $DIST_ID > dist-config.json
ETAG=$(jq -r '.ETag' dist-config.json)
jq '.DistributionConfig.Enabled = false' dist-config.json | jq '.DistributionConfig' > dist-config-disabled.json
aws cloudfront update-distribution --id $DIST_ID --distribution-config file://dist-config-disabled.json --if-match $ETAG

# Wait
aws cloudfront wait distribution-deployed --id $DIST_ID

# Delete
ETAG=$(aws cloudfront get-distribution-config --id $DIST_ID --query 'ETag' --output text)
aws cloudfront delete-distribution --id $DIST_ID --if-match $ETAG
```

---

### Step 2: Delete S3 Bucket

```bash
# Empty the bucket first (required before deletion)
aws s3 rm s3://helloydz.com --recursive

# Delete the bucket
aws s3 rb s3://helloydz.com

echo "✅ S3 bucket deleted!"
```

**If bucket has versioning enabled**:
```bash
# Delete all versions
aws s3api delete-objects \
  --bucket helloydz.com \
  --delete "$(aws s3api list-object-versions \
    --bucket helloydz.com \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
    --output json)"

# Then delete bucket
aws s3 rb s3://helloydz.com
```

---

### Step 3: Delete Route 53 DNS Record

```bash
# Get your hosted zone ID (replace with yours)
HOSTED_ZONE_ID="Z00634592B0WIZQVAIGWA"

# Get CloudFront domain (replace with your actual domain)
CLOUDFRONT_DOMAIN="d1nl3hzbw5of41.cloudfront.net"

# Create delete record JSON
cat > delete-route53-record.json << EOF
{
  "Changes": [
    {
      "Action": "DELETE",
      "ResourceRecordSet": {
        "Name": "helloydz.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CLOUDFRONT_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

# Delete the A record
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://delete-route53-record.json

echo "✅ Route 53 A record deleted!"
```

---

### Step 4: Delete ACM Certificate (Optional)

**⚠️ Only delete if the certificate is NOT used by your backend API!**

```bash
# List certificates
aws acm list-certificates --region us-east-1

# If you have a certificate ONLY for frontend (not wildcard)
CERT_ARN=$(aws acm list-certificates \
  --region us-east-1 \
  --query "CertificateSummaryList[?DomainName=='helloydz.com'].CertificateArn" \
  --output text | head -1)

if [ -n "$CERT_ARN" ]; then
  echo "Deleting certificate: $CERT_ARN"
  aws acm delete-certificate --certificate-arn $CERT_ARN --region us-east-1
  echo "✅ ACM certificate deleted!"
else
  echo "⚠️ No frontend-only certificate found."
  echo "   If you have a wildcard certificate (*.helloydz.com), DO NOT delete it!"
fi
```

**⚠️ If your certificate is `*.helloydz.com` (wildcard), DO NOT delete it** - it's used by your backend API!

---

### Step 5: Delete IAM Resources (Optional)

**Only if you created IAM user/policy specifically for frontend:**

```bash
# Check for frontend-specific IAM user
USER_NAME="github-actions-frontend"

if aws iam get-user --user-name $USER_NAME 2>/dev/null; then
  echo "Deleting IAM user: $USER_NAME"
  
  # Delete access keys
  ACCESS_KEYS=$(aws iam list-access-keys --user-name $USER_NAME --query 'AccessKeyMetadata[].AccessKeyId' --output text)
  for key in $ACCESS_KEYS; do
    aws iam delete-access-key --user-name $USER_NAME --access-key-id $key
  done
  
  # Detach policies
  aws iam list-attached-user-policies --user-name $USER_NAME --query 'AttachedPolicies[].PolicyArn' --output text | \
    xargs -I {} aws iam detach-user-policy --user-name $USER_NAME --policy-arn {}
  
  # Delete user
  aws iam delete-user --user-name $USER_NAME
  
  echo "✅ IAM user deleted"
else
  echo "⚠️ IAM user not found. Skipping..."
fi

# Delete policy (if standalone)
# Replace YOUR-ACCOUNT-ID with your AWS account ID
# aws iam delete-policy --policy-arn arn:aws:iam::YOUR-ACCOUNT-ID:policy/GitHubActionsFrontendDeployment
```

---

## 🚀 Quick Cleanup Script

Use the provided `cleanup-frontend.sh` script:

```bash
cd /Users/yduan/git/helloUI

# Make it executable
chmod +x cleanup-frontend.sh

# Edit the script to update:
# - HOSTED_ZONE_ID
# - CLOUDFRONT_DIST_ID (or leave empty to auto-detect)

# Run cleanup
./cleanup-frontend.sh
```

---

## ✅ Verification

After cleanup, verify resources are deleted:

```bash
# Check CloudFront
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='CloudFront distribution for helloydz.com React app']" \
  --output text
# Should return: (empty)

# Check S3
aws s3 ls s3://helloydz.com 2>&1
# Should return: NoSuchBucket

# Check Route 53
aws route53 list-resource-record-sets \
  --hosted-zone-id Z00634592B0WIZQVAIGWA \
  --query "ResourceRecordSets[?Name=='helloydz.com.']"
# Should not show A record for helloydz.com
```

---

## 💰 Cost Impact

| Resource | Before | After | Monthly Savings |
|----------|--------|-------|----------------|
| CloudFront | ~$0.10/day | $0 | ✅ ~$3/month |
| S3 | ~$0.02/day | $0 | ✅ ~$0.60/month |
| Route 53 | ~$0.50/month | ~$0.50/month* | - |
| **Total** | **~$4/month** | **~$0.50/month** | **✅ ~$3.50/month** |

*Route 53 hosted zone continues (needed for backend API domain)

---

## ⚠️ Important Notes

1. **CloudFront deletion takes 15-30 minutes** - Must disable first, wait, then delete
2. **S3 bucket must be empty** before deletion
3. **Route 53 hosted zone** is NOT deleted (needed for backend)
4. **ACM certificate** - Only delete if NOT used by backend
5. **DNS propagation** - After deleting Route 53 record, DNS changes take 5-30 minutes

---

## 🔄 Re-deploying Later

If you want to re-deploy later, just follow the deployment guide again. All resources can be recreated.

---

## 📊 Summary

**To stop frontend charges**:
1. ✅ Delete CloudFront distribution (disable first, wait, then delete)
2. ✅ Delete S3 bucket (empty first, then delete)
3. ✅ Delete Route 53 A record for helloydz.com
4. ✅ Optional: Delete ACM certificate (if frontend-only)
5. ✅ Optional: Delete IAM resources (if frontend-only)

**Estimated savings**: ~$3.50/month  
**Time required**: ~30-45 minutes (mostly waiting for CloudFront)

**Your backend API will continue to work normally!** 🚀

