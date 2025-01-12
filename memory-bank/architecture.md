
### Performance Characteristics
- Lambda cold start: ~2 seconds
- Lambda warm execution: <500ms
- Snapshot capture: ~30 seconds for 100 resources
- Drift detection: ~60 seconds for analysis


## Security Considerations
- IAM roles follow least-privilege principle
- Secrets managed via environment variables
- No credentials stored in codebase
- Supabase RLS policies enforce data access control

