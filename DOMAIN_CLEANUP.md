# Domain and Route 53 Hosted Zone Cleanup

Complete guide to delete `helloydz.com` domain and Route 53 hosted zone.

---

## 🔍 Understanding Domain vs Hosted Zone

### **Domain Registration** (Ownership)
- **What it is**: You own the domain name `helloydz.com`
- **Where**: Registered with a domain registrar (AWS Route 53, GoDaddy, Namecheap, etc.)
- **Cost**: ~$12-15/year (domain registration fee)
- **Deletion**: Cancels domain ownership (domain becomes available for others to register)

### **Route 53 Hosted Zone** (DNS Management)
- **What it is**: DNS management service for your domain
- **Where**: AWS Route 53
- **Cost**: ~$0.50/month per hosted zone
- **Deletion**: Removes DNS management (domain still registered, but DNS won't work)

---

## ⚠️ Important Decision

**Do you want to**:
1. **Keep the domain** but stop DNS management? → Delete hosted zone only
2. **Completely remove everything**? → Delete hosted zone + cancel domain registration

---

## 🗑️ Step 1: Delete Route 53 Hosted Zone

**This removes DNS management but keeps domain registration.**

### 1.1 List All Records in Hosted Zone

```bash
# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name helloydz.com \
  --query "HostedZones[0].Id" \
  --output text | cut -d'/' -f3)

echo "Hosted Zone ID: $HOSTED_ZONE_ID"

# List all records
aws route53 list-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --output table
```

### 1.2 Delete All Records (Required Before Deleting Hosted Zone)

**⚠️ Route 53 requires hosted zones to be empty before deletion.**

```bash
# Get all records (except NS and SOA - these are system records)
RECORDS=$(aws route53 list-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --query "ResourceRecordSets[?Type!='NS' && Type!='SOA']" \
  --output json)

# Create delete batch
cat > delete-all-records.json << EOF
{
  "Changes": $(echo $RECORDS | jq '[.[] | {Action: "DELETE", ResourceRecordSet: .}]')
}
EOF

# Delete all records
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://delete-all-records.json

echo "✅ All DNS records deleted!"
```

**Or delete specific records manually**:

```bash
# Delete A record for helloydz.com (frontend)
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
          "DNSName": "d1nl3hzbw5of41.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://delete-route53-record.json

# Delete A record for api.helloydz.com (backend) if exists
cat > delete-api-record.json << EOF
{
  "Changes": [
    {
      "Action": "DELETE",
      "ResourceRecordSet": {
        "Name": "api.helloydz.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "your-alb-dns-name.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://delete-api-record.json
```

### 1.3 Delete Hosted Zone

```bash
# Delete the hosted zone
aws route53 delete-hosted-zone \
  --id $HOSTED_ZONE_ID

echo "✅ Route 53 hosted zone deleted!"
```

**Cost impact**: Saves ~$0.50/month

---

## 🗑️ Step 2: Cancel Domain Registration (Optional)

**⚠️ This permanently releases the domain!**

### 2.1 Check Where Domain is Registered

```bash
# Check if registered with AWS Route 53
aws route53domains list-domains \
  --query "Domains[?DomainName=='helloydz.com']" \
  --output table
```

**If domain is registered with AWS Route 53**:

```bash
# Get domain registration details
aws route53domains get-domain-detail \
  --domain-name helloydz.com

# Cancel domain registration (releases domain)
aws route53domains disable-domain-transfer-lock \
  --domain-name helloydz.com

# Delete domain (if supported - AWS may require manual cancellation)
# Note: AWS Route 53 domains typically require cancellation through console
# Go to: Route 53 → Registered domains → helloydz.com → Cancel registration
```

**If domain is registered elsewhere** (GoDaddy, Namecheap, etc.):
- Go to your domain registrar's website
- Cancel/delete domain registration through their interface
- **You cannot delete it via AWS CLI if registered elsewhere**

---

## 📊 Complete Cleanup Checklist

### Route 53 Resources:
- [ ] Delete A record for `helloydz.com` (frontend)
- [ ] Delete A record for `api.helloydz.com` (backend)
- [ ] Delete any other DNS records (CNAME, TXT, etc.)
- [ ] Delete Route 53 hosted zone

### Domain Registration:
- [ ] Check where domain is registered (AWS or external)
- [ ] Cancel domain registration (if you want to release the domain)
- [ ] Update nameservers (if keeping domain but using different DNS)

---

## 💰 Cost Impact

| Resource | Monthly Cost | After Cleanup |
|----------|--------------|----------------|
| Route 53 Hosted Zone | ~$0.50 | $0 |
| Domain Registration | ~$1-1.25/month* | $0 (if cancelled) |

*Domain registration is typically ~$12-15/year, which is ~$1-1.25/month

**Total savings**: ~$1.50-1.75/month

---

## ⚠️ Important Considerations

### If You Keep Domain Registration:

**After deleting hosted zone**, you need to:
1. **Point nameservers elsewhere** (if using another DNS provider)
2. **Or re-create hosted zone** (if you want to use Route 53 again later)

**Domain will stop working** until you:
- Point nameservers to new DNS provider, OR
- Re-create Route 53 hosted zone

### If You Cancel Domain Registration:

**⚠️ Domain becomes available for anyone to register!**
- You lose ownership permanently
- Someone else can register it
- All DNS records are lost
- Cannot be undone

---

## 🔄 Re-registering Later

If you cancel domain registration:
- Domain becomes available after expiration period
- You can re-register it (if no one else took it)
- You'll need to set up DNS again

---

## 🎯 Recommended Approach

### Option 1: Keep Domain, Delete Hosted Zone (Recommended)

**If you might use the domain again**:
```bash
# Delete hosted zone only
# Domain remains registered
# Point nameservers elsewhere or re-create hosted zone later
```

**Benefits**:
- ✅ Keeps domain ownership
- ✅ Can re-use later
- ✅ Saves $0.50/month (hosted zone cost)
- ✅ Domain registration continues (~$1/month)

### Option 2: Delete Everything

**If you're done with the domain completely**:
```bash
# Delete hosted zone
# Cancel domain registration
# Domain becomes available for others
```

**Benefits**:
- ✅ Saves ~$1.50/month total
- ✅ No ongoing costs
- ❌ Loses domain ownership permanently

---

## 📋 Quick Commands Summary

```bash
# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name helloydz.com \
  --query "HostedZones[0].Id" \
  --output text | cut -d'/' -f3)

# Delete all records (except NS/SOA)
# (Use the script above)

# Delete hosted zone
aws route53 delete-hosted-zone --id $HOSTED_ZONE_ID

# Check domain registration
aws route53domains list-domains

# Cancel domain (if registered with AWS Route 53)
# Use AWS Console: Route 53 → Registered domains → Cancel
```

---

## ✅ Verification

After cleanup:

```bash
# Check hosted zone is deleted
aws route53 list-hosted-zones-by-name --dns-name helloydz.com
# Should return: (empty)

# Check domain registration status
aws route53domains list-domains
# Should not show helloydz.com (if cancelled)
```

---

## 🎯 Summary

**To delete Route 53 hosted zone**:
1. ✅ Delete all DNS records
2. ✅ Delete hosted zone
3. ✅ Saves ~$0.50/month

**To cancel domain registration**:
1. ✅ Check where it's registered
2. ✅ Cancel through registrar (AWS Console or external)
3. ✅ Saves ~$1-1.25/month
4. ⚠️ Domain becomes available for others

**Recommendation**: Delete hosted zone first, keep domain registration if you might use it again! 🎯

