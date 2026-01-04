#!/bin/bash
# Domain and Route 53 Hosted Zone Cleanup Script

set -e

DOMAIN="helloydz.com"

echo "🗑️  Starting Domain and Route 53 Cleanup..."
echo ""

# Step 1: Get Hosted Zone ID
echo "📋 Step 1: Finding Route 53 Hosted Zone..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name $DOMAIN \
  --query "HostedZones[0].Id" \
  --output text 2>/dev/null | cut -d'/' -f3 || echo "")

if [ -z "$HOSTED_ZONE_ID" ] || [ "$HOSTED_ZONE_ID" == "None" ]; then
  echo "   ⚠️  No hosted zone found for $DOMAIN"
  echo "   Skipping Route 53 cleanup..."
else
  echo "   Found Hosted Zone ID: $HOSTED_ZONE_ID"
  
  # Step 2: List all records
  echo ""
  echo "📋 Step 2: Listing DNS records..."
  aws route53 list-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --query "ResourceRecordSets[?Type!='NS' && Type!='SOA'].[Name,Type]" \
    --output table
  
  # Step 3: Delete all records
  echo ""
  echo "🗑️  Step 3: Deleting all DNS records..."
  read -p "   Delete all DNS records? (yes/no): " CONFIRM
  
  if [ "$CONFIRM" == "yes" ]; then
    # Get all records except NS and SOA
    RECORDS=$(aws route53 list-resource-record-sets \
      --hosted-zone-id $HOSTED_ZONE_ID \
      --query "ResourceRecordSets[?Type!='NS' && Type!='SOA']" \
      --output json)
    
    if [ "$RECORDS" != "[]" ] && [ -n "$RECORDS" ]; then
      # Create delete batch
      echo "$RECORDS" | jq -c '[.[] | {Action: "DELETE", ResourceRecordSet: .}]' > /tmp/delete-records.json
      
      cat > /tmp/delete-batch.json << EOF
{
  "Changes": $(cat /tmp/delete-records.json)
}
EOF
      
      aws route53 change-resource-record-sets \
        --hosted-zone-id $HOSTED_ZONE_ID \
        --change-batch file:///tmp/delete-batch.json
      
      echo "   ✅ All DNS records deleted!"
    else
      echo "   ⚠️  No records to delete (only NS/SOA remain)"
    fi
  else
    echo "   ⏭️  Skipping record deletion"
  fi
  
  # Step 4: Delete hosted zone
  echo ""
  echo "🗑️  Step 4: Deleting Route 53 Hosted Zone..."
  read -p "   Delete hosted zone? (yes/no): " CONFIRM
  
  if [ "$CONFIRM" == "yes" ]; then
    aws route53 delete-hosted-zone --id $HOSTED_ZONE_ID
    echo "   ✅ Hosted zone deleted!"
  else
    echo "   ⏭️  Skipping hosted zone deletion"
  fi
fi

# Step 5: Check domain registration
echo ""
echo "📋 Step 5: Checking domain registration..."
DOMAIN_REGISTERED=$(aws route53domains list-domains \
  --query "Domains[?DomainName=='$DOMAIN'].DomainName" \
  --output text 2>/dev/null || echo "")

if [ -n "$DOMAIN_REGISTERED" ] && [ "$DOMAIN_REGISTERED" != "None" ]; then
  echo "   ⚠️  Domain is registered with AWS Route 53"
  echo "   To cancel domain registration:"
  echo "   1. Go to AWS Console → Route 53 → Registered domains"
  echo "   2. Select $DOMAIN"
  echo "   3. Click 'Cancel registration' or 'Delete domain'"
  echo ""
  echo "   ⚠️  WARNING: This will permanently release the domain!"
else
  echo "   ℹ️  Domain is not registered with AWS Route 53"
  echo "   If registered elsewhere, cancel through your domain registrar"
fi

# Cleanup temp files
rm -f /tmp/delete-records.json /tmp/delete-batch.json

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "💰 Cost savings:"
echo "   - Route 53 Hosted Zone: ~\$0.50/month"
echo "   - Domain Registration: ~\$1-1.25/month (if cancelled)"
echo "   Total: ~\$1.50-1.75/month"

