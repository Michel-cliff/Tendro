#!/bin/bash
# Run once to remove route-group files that were superseded by flat routing.
# These cause "conflicting routes" errors in Next.js.
rm -f "app/(dashboard)/dashboard/page.tsx"
rm -f "app/(dashboard)/settings/page.tsx"
rm -f "app/(dashboard)/settings/agent/page.tsx"
rm -f "app/(dashboard)/dashboard/tenders/[id]/page.tsx"
rm -f "app/(dashboard)/dashboard/tenders/[id]/pricing/page.tsx"
rm -f "app/(dashboard)/dashboard/tenders/[id]/documents/page.tsx"
rm -f "app/(dashboard)/dashboard/tenders/[id]/send/page.tsx"
rm -f "app/(dashboard)/dashboard/tenders/[id]/rejection/page.tsx"
echo "Cleanup done."
