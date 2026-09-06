# Clone NeevSpaces DB → NeevSpaces-Dev (all tables + all data)
# Fill the two URIs from Neon → each project → Connection details, then run:
#   .\scripts\clone-db.ps1

$prod = "PASTE_NEEVSPACES_URI"
$dev  = "PASTE_NEEVSPACES_DEV_URI"

pg_dump $prod --no-owner --no-acl | psql $dev
Write-Host "Done — Dev is a full clone of NeevSpaces."
