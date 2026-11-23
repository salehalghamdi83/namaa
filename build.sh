#!/bin/sh
# يجمع ملفات src في index.html واحد
cd "$(dirname "$0")"
{ cat src/head.html
  echo '<script src="config.js"></script><script src="vendor/supabase.js"></script>'
  echo '<script>'; echo '{'
  cat src/core.js src/logic.js src/views.js src/sections.js src/manage.js src/actions.js src/mentor.js src/verify.js src/platform.js src/msgs.js src/boot.js
  echo '}'; echo '</script></body></html>'; } > index.html
