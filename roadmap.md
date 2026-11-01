# Roadmap

- [ ] 1. Cleanup: drop no-delete audit triggers temporarily (migration)
- [ ] 2. Delete 3.11M orphaned WiFi journals + lines (batched)
- [ ] 3. Fix INV-0706 corrupted journal (714M) + invoice row + customer balance
- [ ] 4. Re-create audit triggers; VACUUM; verify trial balance loads
- [ ] 5. Unpause WiFi sync, deploy, verify no duplicate journals on re-sync
- [ ] 6. Monthly profit report (sales − COGS − expenses = net profit) with PDF export
- [ ] 7. Backup feature: export all tables + secrets to ZIP (admin-only)
- [ ] 8. Restore feature: upload backup ZIP, rebuild database (admin-only, confirmed)
- [ ] 9. Backup settings: monthly scheduled backup to Google Drive or FTP
- [ ] 10. Admin backup page UI + history
