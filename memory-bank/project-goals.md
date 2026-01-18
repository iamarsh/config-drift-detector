# Project Goals

## Vision

Build a production-ready AWS configuration drift detection system that automatically monitors infrastructure changes, analyzes their impact, and provides real-time alerts for critical modifications.

## Success Criteria

### v1.0 (Current)
- [x] Automated snapshot collection every 30 minutes
- [x] Drift detection comparing against baseline
- [x] Severity classification (CRITICAL, HIGH, MEDIUM, LOW)
- [x] Slack alerting for HIGH/CRITICAL drifts
- [x] Next.js dashboard for drift visualization
- [x] Support for EC2 instances and Security Groups
- [x] Supabase backend for data storage
- [x] CI/CD pipeline via GitHub Actions

### v1.1 (Next Milestone)
- [ ] Add drift acknowledgment feature in dashboard
- [ ] Implement baseline management UI
- [ ] Add real-time dashboard updates (WebSocket)
- [ ] Support for RDS instances
- [ ] Support for S3 buckets
- [ ] Drift trend analysis and reporting

### v2.0 (Future)
- [ ] Multi-account support
- [ ] IAM policy drift detection
- [ ] Lambda function monitoring
- [ ] CloudTrail integration
- [ ] Anomaly detection with ML
- [ ] Custom alerting rules engine
- [ ] API for programmatic access

## Target Users

1. **DevOps Engineers**: Monitor infrastructure changes in real-time
2. **Security Teams**: Track unauthorized modifications
3. **Compliance Officers**: Ensure configuration compliance
4. **Cloud Architects**: Maintain infrastructure integrity

## Key Metrics

- **Detection Latency**: < 5 minutes from change to alert
- **False Positive Rate**: < 5%
- **Dashboard Load Time**: < 2 seconds
- **System Uptime**: > 99.9%
- **Cost**: < $50/month for typical workload

## Non-Goals (v1)

- Real-time change detection (30-min intervals sufficient)
- Automatic remediation of drift
- Multi-cloud support (AWS only for now)
- On-premise deployment (cloud-native only)
