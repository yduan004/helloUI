# Deploy React App to AWS S3 + CloudFront

Complete guide to deploy your React frontend to AWS with custom domain (https://helloydz.com)

---

## 📋 Prerequisites

- ✅ AWS account with appropriate permissions
- ✅ AWS CLI configured (`aws configure`)
- ✅ Domain `helloydz.com` owned/managed by you
- ✅ Backend API running at `https://api.helloydz.com`

---

## 🏗️ Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────────────────────────────┐
│  CloudFront CDN (Global Edge Locations) │
│  ├─ Custom Domain: https://helloydz.com │
│  ├─ SSL/TLS: ACM Certificate            │
│  └─ Caching: Static Assets              │
└────────┬────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│  S3 Bucket (helloydz.com)               │
│  ├─ Static Website Hosting              │
│  ├─ index.html                          │
│  ├─ static/css/...                      │
│  └─ static/js/...                       │
└─────────────────────────────────────────┘

         ↓ API Calls
┌─────────────────────────────────────────┐
│  Backend API (api.helloydz.com)         │
│  └─ Django + ECS Fargate                │
└─────────────────────────────────────────┘
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Request SSL Certificate (ACM)

**Important**: CloudFront requires certificate in **us-east-1** region!

```bash
# Request certificate for your domain
aws acm request-certificate \
  --domain-name helloydz.com \
  --subject-alternative-names "*.helloydz.com" \
  --validation-method DNS \
  --region us-east-1

# Get certificate ARN from output
# Example: arn:aws:acm:us-east-1:123456789012:certificate/abc123...
```

**Important**: You'll need to add DNS validation records to your domain's DNS settings. Check the certificate status:

```bash
aws acm describe-certificate \
  --certificate-arn "arn:aws:acm:us-east-1:YOUR-ACCOUNT-ID:certificate/YOUR-CERT-ID" \
  --region us-east-1
```

Add the CNAME records shown in the output to your DNS provider to validate the certificate.

---

### Step 2: Create S3 Bucket

```bash
# Create S3 bucket (must be globally unique)
aws s3 mb s3://helloydz.com --region us-east-1

# Enable static website hosting
aws s3 website s3://helloydz.com \
  --index-document index.html \
  --error-document index.html
```

**Note**: `error-document` is set to `index.html` for React Router to handle all routes.

---

### Step 3: Configure S3 Bucket Policy

Create a bucket policy to allow CloudFront to access your S3 bucket:

```bash
# Save this to a file: s3-bucket-policy.json
cat > s3-bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::helloydz.com/*"
    }
  ]
}
EOF

# Apply the bucket policy
aws s3api put-bucket-policy \
  --bucket helloydz.com \
  --policy file://s3-bucket-policy.json
```

---

### Step 4: Build React App for Production

```bash
cd /Users/yduan/git/helloUI

# Build with production environment variables
npm run build

# This creates optimized production build in ./build/
```

**What happens**:
- React app reads `REACT_APP_API_URL=https://api.helloydz.com/api` from `.env.production`
- Creates minified, optimized bundle
- Output in `build/` directory

---

### Step 5: Upload to S3

```bash
# Upload all files from build directory
aws s3 sync build/ s3://helloydz.com/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "service-worker.js"

# Upload HTML files with no-cache (to get updates immediately)
aws s3 sync build/ s3://helloydz.com/ \
  --exclude "*" \
  --include "*.html" \
  --include "service-worker.js" \
  --cache-control "no-cache, no-store, must-revalidate"
```

**Cache Strategy**:
- Static assets (JS/CSS): 1 year cache (immutable file names)
- HTML files: No cache (to fetch updated versions)

---

### Step 6: Create CloudFront Distribution

Create a CloudFront distribution configuration file:

```bash
cat > cloudfront-config.json << 'EOF'
{
  "CallerReference": "helloydz-ui-2024-01-03",
  "Comment": "CloudFront distribution for helloydz.com React app",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-helloydz.com",
        "DomainName": "helloydz.com.s3-website-us-east-1.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-helloydz.com",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Aliases": {
    "Quantity": 1,
    "Items": ["helloydz.com"]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:YOUR-ACCOUNT-ID:certificate/YOUR-CERT-ID",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "PriceClass": "PriceClass_100",
  "HttpVersion": "http2"
}
EOF
```

**Update the certificate ARN** in the file, then create the distribution:

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

**Note**: CloudFront deployment takes 15-30 minutes to propagate globally.

---

### Step 7: Update DNS Records

Get your CloudFront distribution domain name:

```bash
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='CloudFront distribution for helloydz.com React app'].DomainName" \
  --output text
```

**Output example**: `d1234567890abc.cloudfront.net`

#### If using Route 53:

```bash
# Get your hosted zone ID
aws route53 list-hosted-zones-by-name \
  --dns-name helloydz.com

# Create A record (Alias to CloudFront)
cat > route53-record.json << 'EOF'
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "helloydz.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "/hostedzone/Z2FDTNDATAQYW2",
          "DNSName": "d1234567890abc.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR-HOSTED-ZONE-ID \
  --change-batch file://route53-record.json
```

**Note**: `Z2FDTNDATAQYW2` is the universal CloudFront hosted zone ID.

#### If using another DNS provider:

Create an **A record** (or **CNAME**) pointing `helloydz.com` to your CloudFront domain.

---

### Step 8: Update Backend CORS Settings

Update Django backend to allow requests from your frontend domain:

```bash
cd /Users/yduan/git/helloApi
```

Update `ecs-task-definition.json` environment variables:

```json
{
  "name": "CORS_ALLOWED_ORIGINS",
  "value": "https://helloydz.com,http://localhost:3000"
}
```

Deploy the updated task definition:

```bash
# Register updated task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json

# Force new deployment
aws ecs update-service \
  --cluster helloapi-cluster \
  --service helloapi-service \
  --force-new-deployment \
  --region us-east-1
```

---

## ✅ Verification

### 1. Test Frontend Access

```bash
# Test CloudFront distribution
curl -I https://helloydz.com

# Should return:
# HTTP/2 200
# content-type: text/html
# x-cache: Hit from cloudfront
```

### 2. Test API Connectivity

Open browser console at `https://helloydz.com` and run:

```javascript
fetch('https://api.helloydz.com/api/users/')
  .then(res => res.json())
  .then(data => console.log(data))
```

Should return user data without CORS errors.

### 3. Test React Router

Visit different routes:
- `https://helloydz.com/` ✅
- `https://helloydz.com/users` ✅
- Refresh page on any route ✅ (should not 404)

---

## 🔄 Continuous Deployment

### Manual Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🏗️  Building React app..."
npm run build

echo "📦 Uploading to S3..."
aws s3 sync build/ s3://helloydz.com/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html"

aws s3 sync build/ s3://helloydz.com/ \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-cache"

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR-DISTRIBUTION-ID \
  --paths "/*"

echo "✅ Deployment complete!"
```

Make it executable:

```bash
chmod +x deploy.sh
```

---

## 📊 Cost Estimate

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **S3** | 1GB storage + 10K requests | ~$0.50 |
| **CloudFront** | 100GB transfer + 1M requests | ~$10-15 |
| **ACM Certificate** | SSL/TLS certificate | **FREE** |
| **Route 53** | Hosted zone + queries | ~$0.50-1 |
| **Total** | | ~$11-17/month |

**Free Tier**: First year includes significant free tier allowances.

---

## 🐛 Troubleshooting

### Issue: 403 Forbidden from CloudFront
- Check S3 bucket policy allows public read
- Verify CloudFront origin is correctly configured

### Issue: CORS errors in browser console
- Verify backend `CORS_ALLOWED_ORIGINS` includes `https://helloydz.com`
- Check network tab for preflight OPTIONS requests

### Issue: 404 on page refresh
- Ensure CloudFront custom error responses redirect to `index.html`
- Verify S3 error document is set to `index.html`

### Issue: Changes not appearing
- CloudFront caches content - create invalidation:
  ```bash
  aws cloudfront create-invalidation \
    --distribution-id YOUR-DIST-ID \
    --paths "/*"
  ```

### Issue: SSL certificate pending validation
- Add CNAME records to your DNS provider
- Wait 5-30 minutes for validation
- Check status: `aws acm describe-certificate`

---

## 🔒 Security Best Practices

1. **Enable CloudFront OAI** (Origin Access Identity) for better S3 security
2. **Enable CloudFront logging** to S3 for monitoring
3. **Set up AWS WAF** (Web Application Firewall) for DDoS protection
4. **Enable CloudFront field-level encryption** for sensitive data
5. **Use S3 versioning** to enable rollback if needed

---

## 📚 Additional Resources

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [ACM Certificate Validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

---

## 🎯 Next Steps

After deployment:
1. ✅ Set up CloudWatch alarms for monitoring
2. ✅ Enable CloudFront access logs
3. ✅ Configure AWS WAF rules
4. ✅ Set up automated deployments (GitHub Actions)
5. ✅ Add custom domain for www.helloydz.com

---

**Your React app is now live at**: https://helloydz.com 🎉

