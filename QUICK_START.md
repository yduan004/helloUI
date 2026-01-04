# Quick Start: Deploy React App to AWS

Fast track guide to deploy your React app to https://helloydz.com

---

## ⚡ Prerequisites

```bash
# Verify AWS CLI is configured
aws sts get-caller-identity

# Verify you're in the correct directory
cd /Users/yduan/git/helloUI
```

---

## 🚀 Deployment Steps (15 minutes)

### 1️⃣ Request SSL Certificate (5 min)

```bash
# Request certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
  --domain-name helloydz.com \
  --subject-alternative-names "*.helloydz.com" \
  --validation-method DNS \
  --region us-east-1
```

**Get certificate ARN from output**, then validate it:

```bash
# Get validation CNAME records
aws acm describe-certificate \
  --certificate-arn "YOUR-CERT-ARN" \
  --region us-east-1 \
  --query "Certificate.DomainValidationOptions[0].ResourceRecord"
```

**Add the CNAME record to your DNS provider**, then wait for validation:

```bash
# Check status (wait until Status=ISSUED)
aws acm describe-certificate \
  --certificate-arn "YOUR-CERT-ARN" \
  --region us-east-1 \
  --query "Certificate.Status"
```

---

### 2️⃣ Create S3 Bucket (1 min)

```bash
# Create bucket
aws s3 mb s3://helloydz.com --region us-east-1

# Enable static website hosting
aws s3 website s3://helloydz.com \
  --index-document index.html \
  --error-document index.html

# Apply bucket policy
aws s3api put-bucket-policy \
  --bucket helloydz.com \
  --policy file://s3-bucket-policy.json
```

---

### 3️⃣ Build and Upload (2 min)

```bash
# Build React app
npm run build

# Upload to S3
aws s3 sync build/ s3://helloydz.com/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html"

aws s3 sync build/ s3://helloydz.com/ \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-cache"
```

---

### 4️⃣ Create CloudFront Distribution (3 min setup + 20 min propagation)

**First, update `cloudfront-config.json`**:
- Replace `YOUR-ACCOUNT-ID` and `YOUR-CERT-ID` with your certificate ARN

```bash
# Create distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json

# Get distribution domain name
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='CloudFront distribution for helloydz.com React app'].DomainName" \
  --output text
```

**Save the distribution domain** (e.g., `d1234567890abc.cloudfront.net`)

---

### 5️⃣ Update DNS (2 min)

**Get CloudFront domain from Step 4**, then:

#### If using Route 53:

```bash
# Get hosted zone ID
aws route53 list-hosted-zones-by-name \
  --dns-name helloydz.com \
  --query "HostedZones[0].Id" \
  --output text

# Create A record (update with your CloudFront domain)
cat > route53-record.json << 'EOF'
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "helloydz.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "d1234567890abc.cloudfront.net",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR-HOSTED-ZONE-ID \
  --change-batch file://route53-record.json
```

#### If using another DNS provider:

Add an **A record** (or CNAME) pointing `helloydz.com` to your CloudFront domain.

---

### 6️⃣ Update Backend CORS (2 min)

```bash
cd /Users/yduan/git/helloApi
```

Update `ecs-task-definition.json`, find the `CORS_ALLOWED_ORIGINS` environment variable and update it:

```json
{
  "name": "CORS_ALLOWED_ORIGINS",
  "value": "https://helloydz.com,http://localhost:3000"
}
```

Deploy:

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

### Test Frontend:

```bash
# Wait for CloudFront deployment (~20 min)
curl -I https://helloydz.com

# Should return: HTTP/2 200
```

### Test API Connection:

Open https://helloydz.com in browser, check console for:
- ✅ No CORS errors
- ✅ API calls to https://api.helloydz.com succeed
- ✅ User data loads correctly

---

## 🔄 Future Deployments

### Manual:

```bash
cd /Users/yduan/git/helloUI
./deploy.sh
```

### Automatic (GitHub Actions):

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

See `CICD_SETUP.md` for GitHub Actions setup.

---

## 📊 Architecture

```
Users → https://helloydz.com (CloudFront)
          ↓
        S3 Bucket (Static Files)
          ↓ API Calls
        https://api.helloydz.com (ALB)
          ↓
        ECS Fargate (Django)
          ↓
        RDS PostgreSQL
```

---

## 🐛 Common Issues

### Issue: Certificate still "Pending Validation"
**Fix**: Add CNAME records to DNS, wait 5-30 minutes

### Issue: CORS errors in browser
**Fix**: Check backend `CORS_ALLOWED_ORIGINS` includes `https://helloydz.com`

### Issue: 404 on page refresh
**Fix**: Ensure CloudFront error responses redirect to `index.html` (already configured)

### Issue: Changes not visible
**Fix**: Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR-DIST-ID \
  --paths "/*"
```

---

## 📚 Full Documentation

- **AWS_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **CICD_SETUP.md** - GitHub Actions CI/CD setup
- **deploy.sh** - Manual deployment script

---

## 🎯 Next Steps

After deployment:
1. ✅ Set up GitHub Actions for automatic deployment
2. ✅ Add www.helloydz.com subdomain
3. ✅ Enable CloudFront access logs
4. ✅ Set up CloudWatch alarms
5. ✅ Configure AWS WAF for security

---

**Your React app will be live at**: https://helloydz.com 🚀

