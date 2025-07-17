Production Kanban System - User Manual v2.3

========================================

🚀 Quick Start:
1. Double-click start.bat
2. Browser will open automatically

📋 Launch Options:
- start.bat: Auto-detect Python/Node.js (RECOMMENDED)
- start-nodejs.bat: Use Node.js server
- start-simple.bat: Direct browser (may have limitations)

💻 System Requirements:
- Windows 7 SP1 or higher
- Python 3.6+ OR Node.js 12+ (one is enough)
- Modern browser (Chrome 58+, Edge 79+)
- WebAssembly support

🏢 Intranet Environment:
- Run setup-portable.bat for portable Node.js setup

Features:
- Task kanban management
- Excel import/export
- Local data storage
- Master assignment
- Gantt chart visualization

Important Notes:
1. Data is stored locally in browser
2. Regular backup recommended
3. Portable - can copy to any location
4. Supports multiple computers independently
5. HTTP server avoids CORS security restrictions

🔧 Troubleshooting:
- Database stuck: Open diagnose-sqlite.html for diagnosis
- Blank page: Use start.bat (ensures HTTP server)
- Import failed: Use .xlsx format Excel files
- Data lost: Check browser storage settings
- Port busy: System auto-tries alternative ports
- No Python/Node.js: Run setup-portable.bat

Version: v2.3.0
Created: 2025-01-17
Updated: Simplified deployment package and improved user experience
