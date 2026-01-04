# GitHub Actions CI/CD Setup for React App

Complete guide to set up automated deployment of your React app to AWS S3 + CloudFront using GitHub Actions.

---

## 📋 Overview

This workflow automatically deploys your React app to AWS when you push to the `main` branch.

**Workflow**:
```
Push to main → GitHub Actions → Build React App → Upload to S3 → Invalidate CloudFront → Live ✅
```

---

## 🔐 Step 1: Create AWS IAM User for GitHub Actions

### 1.1 Create IAM Policy

Create a file `github-actions-frontend-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::helloydz.com",
        "arn:aws:s3:::helloydz.com/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "*"
    }
  ]
}
```

Create the policy:

```bash
aws iam create-policy \
  --policy-name GitHubActionsFrontendDeployment \
  --policy-document file://github-actions-frontend-policy.json
```

### 1.2 Create IAM User

```bash
# Create user
aws iam create-user --user-name github-actions-frontend

# Attach policy (replace ACCOUNT_ID with your AWS account ID)
aws iam attach-user-policy \
  --user-name github-actions-frontend \
  --policy-arn arn:aws:iam::YOUR-ACCOUNT-ID:policy/GitHubActionsFrontendDeployment

# Create access key
aws iam create-access-key --user-name github-actions-frontend
```

**Save the output** - you'll need `AccessKeyId` and `SecretAccessKey`.

---

## 🔑 Step 2: Add Secrets to GitHub Repository

Go to your GitHub repository:

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | From IAM user creation |
| `AWS_SECRET_ACCESS_KEY` | `wJalr...` | From IAM user creation |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E1234ABCD5678` | Your CloudFront distribution ID |

### Get CloudFront Distribution ID:

```bash
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='CloudFront distribution for helloydz.com React app'].Id" \
  --output text
```

---

## 📄 Step 3: Workflow File

The workflow file is already created at `.github/workflows/deploy.yml`.

**What it does**:
1. ✅ Checks out code
2. ✅ Sets up Node.js 18
3. ✅ Installs dependencies (`npm ci`)
4. ✅ Builds React app with production API URL
5. ✅ Uploads to S3 with proper cache headers
6. ✅ Invalidates CloudFront cache
7. ✅ Reports success

---

## 🚀 Step 4: Trigger Deployment

### Automatic Deployment (on push to main):

```bash
cd /Users/yduan/git/helloUI

# Make some changes
echo "// Updated" >> src/App.tsx

# Commit and push
git add .
git commit -m "Deploy to production"
git push origin main
```

### Manual Deployment:

Go to GitHub:
- **Actions** tab
- Select **Deploy React App to S3 + CloudFront**
- Click **Run workflow**
- Select `main` branch
- Click **Run workflow**

---

## 📊 Monitoring Deployment

### View in GitHub Actions:

1. Go to **Actions** tab in your repository
2. Click on the latest workflow run
3. Watch the logs in real-time

### Check Deployment Status:

```bash
# Check S3 files
aws s3 ls s3://helloydz.com/ --recursive

# Check CloudFront invalidation status
aws cloudfront list-invalidations \
  --distribution-id YOUR-DIST-ID \
  --max-items 5
```

---

## ✅ Verification

### 1. Check GitHub Actions

- ✅ All steps should be green
- ✅ Check logs for any errors
- ✅ Build should complete in ~2-3 minutes

### 2. Check S3

```bash
# List files in S3
aws s3 ls s3://helloydz.com/ --recursive --human-readable

# Should show:
# index.html
# static/css/main.xxx.css
# static/js/main.xxx.js
# ...
```

### 3. Check Website

```bash
# Test HTTPS
curl -I https://helloydz.com

# Should return HTTP/2 200
```

Open in browser: https://helloydz.com

---

## 🐛 Troubleshooting

### Issue: "AccessDenied" error during S3 upload

**Solution**: Check IAM policy has correct S3 permissions:
```bash
aws iam list-attached-user-policies --user-name github-actions-frontend
```

### Issue: "InvalidCredentials" error

**Solution**: Verify GitHub secrets are correctly set:
- Go to **Settings** → **Secrets and variables** → **Actions**
- Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct

### Issue: Build fails with "Module not found"

**Solution**: Make sure `package-lock.json` is committed:
```bash
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Issue: CloudFront invalidation fails

**Solution**: Check CloudFront distribution ID:
```bash
aws cloudfront list-distributions --query "DistributionList.Items[].Id"
```

Update GitHub secret `CLOUDFRONT_DISTRIBUTION_ID`.

### Issue: Changes not visible after deployment

**Solution**: CloudFront cache takes time to invalidate:
- Wait 3-5 minutes
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check CloudFront invalidation status

---

## 🎯 Advanced Configuration

### Enable Environment-Specific Deployments

Create separate workflows for staging and production:

**`.github/workflows/deploy-staging.yml`**:
```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop

env:
  S3_BUCKET: staging.helloydz.com
  REACT_APP_API_URL: https://staging-api.helloydz.com/api
```

### Add Build Optimization

```yaml
- name: Build React app
  run: |
    npm run build
    echo "Build size:"
    du -sh build/
  env:
    REACT_APP_API_URL: https://api.helloydz.com/api
    GENERATE_SOURCEMAP: false  # Disable sourcemaps for smaller builds
```

### Add Slack Notifications

```yaml
- name: Notify Slack on success
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "✅ Frontend deployed successfully to https://helloydz.com"
      }
```

---

## 📈 Deployment Metrics

Track your deployments:

| Metric | Target | Actual |
|--------|--------|--------|
| Build time | < 3 min | ~2 min |
| Upload time | < 1 min | ~30 sec |
| Cache invalidation | < 5 min | ~3 min |
| **Total deployment** | **< 10 min** | **~6 min** |

---

## 🔒 Security Best Practices

1. ✅ **Never commit AWS credentials** to repository
2. ✅ **Use least-privilege IAM policies** (only required permissions)
3. ✅ **Rotate access keys** every 90 days
4. ✅ **Enable CloudTrail** for audit logging
5. ✅ **Use environment protection rules** in GitHub

### Enable Branch Protection:

Go to GitHub:
- **Settings** → **Branches**
- Add rule for `main` branch:
  - ✅ Require pull request reviews
  - ✅ Require status checks to pass
  - ✅ Require deployments to succeed before merging

---

## 📚 Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [CloudFront Cache Invalidation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)

---

## 🎉 Summary

You now have:
- ✅ Automated deployment pipeline
- ✅ Secure IAM credentials
- ✅ CloudFront cache invalidation
- ✅ Production-ready workflow
- ✅ Monitoring and troubleshooting tools

**Every push to `main` automatically deploys to production!** 🚀

